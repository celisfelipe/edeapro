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
 *   - Cada adicional de una cita suma MINUTOS_ADICIONAL a su duración.
 *   - Una cita de "Servicio individual" (solo adicionales, ej. corte de uñas)
 *     dura solo lo de sus adicionales.
 *   - No se aceptan fechas ni horas que ya pasaron.
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

    /** Minutos que suma cada adicional (el mismo valor que muestra la agenda: "~20 min") */
    const MINUTOS_ADICIONAL = 20;

    /**
     * Nombre del registro de la tabla servicio que se usa para las citas de
     * solo adicionales. Toda cita necesita un id_servicio, así que estas
     * citas usan este servicio (no tiene razas ni precio propio).
     */
    const SERVICIO_INDIVIDUAL = 'Servicio individual';

    /** Caché por petición del id del "Servicio individual" (false = aún no consultado) */
    private int|null|false $idIndividual = false;

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
     * id_servicio del "Servicio individual", o null si no existe en la base de datos.
     */
    public function idServicioIndividual(): ?int
    {
        if ($this->idIndividual === false) {
            $fila = DB::selectOne("SELECT id_servicio FROM servicio WHERE nombre_servicio = ?", [self::SERVICIO_INDIVIDUAL]);
            $this->idIndividual = $fila ? intval($fila->id_servicio) : null;
        }
        return $this->idIndividual;
    }

    /**
     * Duración en minutos de un servicio para una raza, según raza_servicio.
     * Si la combinación no existe (ej. citas antiguas con id_raza = NULL), usa
     * la duración más larga registrada para ese servicio, como margen de
     * seguridad para no subestimar cuánto tiempo ocupa.
     */
    public function duracion(?int $id_raza, int $id_servicio): int
    {
        // Solo adicionales: el servicio en sí no ocupa tiempo
        if ($id_servicio === $this->idServicioIndividual()) {
            return 0;
        }
        if ($id_raza) {
            $fila = DB::selectOne(
                "SELECT duracion FROM raza_servicio WHERE id_raza = ? AND id_servicio = ?",
                [$id_raza, $id_servicio]
            );
            if ($fila && intval($fila->duracion) > 0) return intval($fila->duracion);
        }
        return $this->duracionMaximaDeServicio($id_servicio);
    }

    /**
     * Duración total de una cita ya guardada: su servicio más sus adicionales.
     * Se usa al reagendar, para mover la cita con todo su tiempo real.
     */
    public function duracionDeCita(int $id_cita): int
    {
        $cita = DB::selectOne(
            "SELECT id_raza, id_servicio,
                    (SELECT COUNT(*) FROM adicional_cita ac WHERE ac.id_cita = c.id_cita) AS n_adicionales
             FROM cita c WHERE c.id_cita = ?",
            [$id_cita]
        );
        if (!$cita) return self::DURACION_POR_DEFECTO;

        $base = $this->duracion($cita->id_raza ? intval($cita->id_raza) : null, intval($cita->id_servicio));
        return $base + intval($cita->n_adicionales) * self::MINUTOS_ADICIONAL;
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
     * de un estilista en una fecha, con la duración real de cada una
     * (servicio + MINUTOS_ADICIONAL por cada adicional).
     *
     * @param int|null $excluirCita id_cita a ignorar (la cita que se está
     *                              reagendando no debe bloquearse a sí misma)
     */
    public function rangosOcupados(int $id_estilista, string $fecha_bd, ?int $excluirCita = null): array
    {
        $citas = DB::select("
            SELECT c.hora, c.id_servicio, rs.duracion,
                   (SELECT COUNT(*) FROM adicional_cita ac WHERE ac.id_cita = c.id_cita) AS n_adicionales
            FROM cita c
            LEFT JOIN raza_servicio rs ON rs.id_raza = c.id_raza AND rs.id_servicio = c.id_servicio
            WHERE c.id_estilista = ? AND c.fecha = ? AND c.estado != 'Cancelada'
              AND c.id_cita != ?
        ", [$id_estilista, $fecha_bd, $excluirCita ?? 0]);

        $rangos = [];
        foreach ($citas as $c) {
            $duracion = match (true) {
                intval($c->id_servicio) === $this->idServicioIndividual() => 0,   // solo adicionales
                $c->duracion !== null => intval($c->duracion),
                default => $this->duracionMaximaDeServicio(intval($c->id_servicio)),
            };
            $duracion += intval($c->n_adicionales) * self::MINUTOS_ADICIONAL;
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

    /**
     * Indica si una fecha y hora ya pasaron (o están a menos de
     * $margenMinutos de ahora). Usa la hora de Colombia (config/app.php).
     */
    public function yaPaso(string $fecha_bd, string $hora, int $margenMinutos = 0): bool
    {
        return strtotime($fecha_bd . ' ' . $hora) <= time() + $margenMinutos * 60;
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
     * terminando a más tardar a las 17:00, sin solaparse con otras citas y
     * sin horas que ya pasaron (o a menos de $margenMinutos de ahora).
     */
    public function horariosDisponibles(int $id_estilista, string $fecha_bd, int $duracion, ?int $excluirCita = null, int $margenMinutos = 0): array
    {
        if (!$this->esDiaHabil($fecha_bd) || $this->estaBloqueado($id_estilista, $fecha_bd)) {
            return [];
        }

        $rangos      = $this->rangosOcupados($id_estilista, $fecha_bd, $excluirCita);
        $ultimoInicio = self::CIERRE - $duracion;
        $libres      = [];

        for ($inicio = self::APERTURA; $inicio <= $ultimoInicio; $inicio += self::MINUTOS_SLOT) {
            $hora = self::aHora($inicio);
            if (!$this->yaPaso($fecha_bd, $hora, $margenMinutos) && !$this->seSolapa($rangos, $inicio, $inicio + $duracion)) {
                $libres[] = $hora;
            }
        }
        return $libres;
    }

    /**
     * Valida en el servidor que una cita concreta se pueda guardar.
     * Devuelve null si es válida, o el mensaje de error para el usuario.
     * Rechaza fechas u horas que ya pasaron: el navegador las oculta, pero
     * alguien podría enviarlas a mano a la API.
     */
    public function validarHorario(int $id_estilista, string $fecha_bd, string $hora, int $duracion, ?int $excluirCita = null): ?string
    {
        $inicio = self::aMinutos($hora);

        if (!strtotime($fecha_bd) || $this->yaPaso($fecha_bd, $hora)) {
            return 'Esa fecha u hora ya pasó. Elige un horario disponible.';
        }
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
