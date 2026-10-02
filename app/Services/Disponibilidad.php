<?php

/**
 * Disponibilidad
 * ==============
 * Reglas de disponibilidad de los estilistas, compartidas por el
 * agendamiento inicial (CitaController) y el reagendamiento desde el
 * perfil del cliente (ClienteController). Si cambia una regla, cambia aquí
 * y aplica a los dos flujos.
 *
 * Reglas:
 *   - Horario de atención: 09:00 a 17:00, de lunes a sábado.
 *   - Los horarios de inicio van cada 15 min. Una cita de N minutos solo
 *     puede empezar si termina a más tardar a las 17:00
 *     (último inicio = 17:00 − duración; ej. 60 min → 16:00, 30 min → 16:30).
 *   - La cita completa [inicio, inicio + duración) no puede solaparse con
 *     otra cita activa (no cancelada) del mismo estilista.
 *   - Un estilista con bloqueo temporal (vacaciones, etc.) ese día no tiene
 *     horarios disponibles.
 *
 * Todas las horas se manejan internamente como minutos desde la medianoche.
 */

namespace App\Services;

use Illuminate\Support\Facades\DB;

class Disponibilidad
{
    const APERTURA     = 9 * 60;    // 09:00
    const CIERRE       = 17 * 60;   // 17:00
    const MINUTOS_SLOT = 15;

    /** Duración por defecto (min) si no se encuentra ninguna en el catálogo */
    const DURACION_POR_DEFECTO = 60;

    /** Caché por petición de la duración máxima de cada servicio */
    private ?array $maximosPorServicio = null;

    /** Convierte "HH:MM" o "HH:MM:SS" a minutos desde la medianoche */
    public static function aMinutos(string $hora): int
    {
        [$h, $m] = array_map('intval', explode(':', $hora));
        return $h * 60 + $m;
    }

    /** Convierte minutos desde la medianoche a "HH:MM" */
    public static function aHora(int $minutos): string
    {
        return sprintf('%02d:%02d', intdiv($minutos, 60), $minutos % 60);
    }

    /**
     * Duración en minutos de un servicio para una raza, según raza_servicio.
     * Si la combinación no existe (ej. citas antiguas con id_raza = NULL), usa
     * la duración más larga registrada para ese servicio, como margen de
     * seguridad para no subestimar cuánto tiempo ocupa.
     */
    public function duracion(?int $id_raza, int $id_servicio): int
    {
        if ($id_raza) {
            $fila = DB::selectOne(
                "SELECT duracion FROM raza_servicio WHERE id_raza = ? AND id_servicio = ?",
                [$id_raza, $id_servicio]
            );
            if ($fila && intval($fila->duracion) > 0) return intval($fila->duracion);
        }
        return $this->duracionMaximaDeServicio($id_servicio);
    }

    /** Duración más larga registrada para un servicio (respaldo conservador) */
    private function duracionMaximaDeServicio(int $id_servicio): int
    {
        if ($this->maximosPorServicio === null) {
            $this->maximosPorServicio = [];
            // duracion es texto ("45 min"); intval toma el número del inicio
            foreach (DB::select("SELECT id_servicio, duracion FROM raza_servicio") as $fila) {
                $min = intval($fila->duracion);
                if ($min > ($this->maximosPorServicio[$fila->id_servicio] ?? 0)) {
                    $this->maximosPorServicio[$fila->id_servicio] = $min;
                }
            }
        }
        return $this->maximosPorServicio[$id_servicio] ?? self::DURACION_POR_DEFECTO;
    }

    /**
     * Rangos [inicio, fin) en minutos de las citas activas (no canceladas)
     * de un estilista en una fecha, con la duración real de cada una.
     *
     * @param int|null $excluirCita id_cita a ignorar (la cita que se está
     *                              reagendando no debe bloquearse a sí misma)
     */
    public function rangosOcupados(int $id_estilista, string $fecha_bd, ?int $excluirCita = null): array
    {
        $citas = DB::select("
            SELECT c.hora, c.id_servicio, rs.duracion
            FROM cita c
            LEFT JOIN raza_servicio rs ON rs.id_raza = c.id_raza AND rs.id_servicio = c.id_servicio
            WHERE c.id_estilista = ? AND c.fecha = ? AND c.estado != 'Cancelada'
              AND c.id_cita != ?
        ", [$id_estilista, $fecha_bd, $excluirCita ?? 0]);

        $rangos = [];
        foreach ($citas as $c) {
            $duracion = $c->duracion !== null
                ? intval($c->duracion)
                : $this->duracionMaximaDeServicio(intval($c->id_servicio));
            $inicio   = self::aMinutos($c->hora);
            $rangos[] = [$inicio, $inicio + $duracion];
        }
        return $rangos;
    }

    /** Indica si el rango [$inicio, $fin) se solapa con alguno de los $rangos */
    public function seSolapa(array $rangos, int $inicio, int $fin): bool
    {
        foreach ($rangos as [$ini, $fn]) {
            if ($ini < $fin && $fn > $inicio) return true;
        }
        return false;
    }

    /**
     * Indica si un estilista tiene un bloqueo temporal (ej. vacaciones) que
     * cubra esa fecha. Es independiente de estilista.disponibilidad.
     */
    public function estaBloqueado(int $id_estilista, string $fecha_bd): bool
    {
        return DB::selectOne(
            "SELECT 1 FROM disponibilidad_estilista
             WHERE id_estilista = ? AND ? BETWEEN fecha_inicio AND fecha_fin LIMIT 1",
            [$id_estilista, $fecha_bd]
        ) !== null;
    }

    /** El negocio atiende de lunes a sábado */
    public function esDiaHabil(string $fecha_bd): bool
    {
        return date('w', strtotime($fecha_bd)) !== '0';
    }

    /** Indica si el estilista está activo y marcado como disponible */
    public function estilistaAtiende(int $id_estilista): bool
    {
        return DB::selectOne(
            "SELECT 1 FROM estilista WHERE id_estilista = ? AND estado = 'Activo' AND disponibilidad = 'Disponible'",
            [$id_estilista]
        ) !== null;
    }

    /**
     * Horarios de inicio ("HH:MM") en los que el estilista puede atender una
     * cita de $duracion minutos esa fecha: dentro del horario de atención,
     * terminando a más tardar a las 17:00 y sin solaparse con otras citas.
     */
    public function horariosDisponibles(int $id_estilista, string $fecha_bd, int $duracion, ?int $excluirCita = null): array
    {
        if (!$this->esDiaHabil($fecha_bd) || $this->estaBloqueado($id_estilista, $fecha_bd)) {
            return [];
        }

        $rangos      = $this->rangosOcupados($id_estilista, $fecha_bd, $excluirCita);
        $ultimoInicio = self::CIERRE - $duracion;
        $libres      = [];

        for ($inicio = self::APERTURA; $inicio <= $ultimoInicio; $inicio += self::MINUTOS_SLOT) {
            if (!$this->seSolapa($rangos, $inicio, $inicio + $duracion)) {
                $libres[] = self::aHora($inicio);
            }
        }
        return $libres;
    }

    /**
     * Valida en el servidor que una cita concreta se pueda guardar.
     * Devuelve null si es válida, o el mensaje de error para el usuario.
     */
    public function validarHorario(int $id_estilista, string $fecha_bd, string $hora, int $duracion, ?int $excluirCita = null): ?string
    {
        $inicio = self::aMinutos($hora);

        if (!$this->esDiaHabil($fecha_bd)) {
            return 'No atendemos los domingos.';
        }
        if ($inicio < self::APERTURA || $inicio + $duracion > self::CIERRE) {
            return 'El servicio debe empezar desde las 9:00 AM y terminar a más tardar a las 5:00 PM.';
        }
        if ($this->estaBloqueado($id_estilista, $fecha_bd)) {
            return 'Ese estilista no está disponible en esa fecha.';
        }
        if ($this->seSolapa($this->rangosOcupados($id_estilista, $fecha_bd, $excluirCita), $inicio, $inicio + $duracion)) {
            return 'Ese estilista ya tiene una cita que se solapa con este horario.';
        }
        return null;
    }
}
