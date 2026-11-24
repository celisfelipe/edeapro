<?php

/**
 * CitaController
 * ==============
 * Controla toda la lógica de la agenda pública (agenda.js).
 * Permite a cualquier usuario ver servicios, estilistas y agendar citas.
 *
 * Rutas: GET  /api/citas/servicios
 *        GET  /api/citas/adicionales
 *        GET  /api/citas/estilistas
 *        GET  /api/citas/slots
 *        POST /api/citas/crear
 */

namespace App\Http\Controllers;

use App\Services\Disponibilidad;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CitaController extends Controller
{
    /**
     * Devuelve todos los servicios disponibles con su raza, duración y precio.
     * Usa un JOIN entre raza_servicio, raza y servicio.
     */
    public function servicios()
    {
        $datos = DB::select("
            SELECT r.id_raza, r.nombre_raza, s.id_servicio, s.nombre_servicio,
                   rs.duracion, rs.precio
            FROM raza_servicio rs
            JOIN raza r ON rs.id_raza = r.id_raza
            JOIN servicio s ON rs.id_servicio = s.id_servicio
            ORDER BY s.id_servicio, r.nombre_raza
        ");
        return response()->json(['ok' => true, 'servicios' => $datos]);
    }

    /**
     * Devuelve los servicios adicionales (ej: secado, desparasitación).
     * El cliente puede elegirlos como extras en la agenda.
     */
    public function adicionales()
    {
        $datos = DB::select("SELECT * FROM adicional");
        return response()->json(['ok' => true, 'adicionales' => $datos]);
    }

    /**
     * Devuelve los estilistas disponibles para agendar.
     * Solo los que tienen estado='Activo' y disponibilidad='Disponible'.
     */
    public function estilistas()
    {
        $datos = DB::select("
            SELECT id_estilista, nombre_estilista, apellido_estilista
            FROM estilista
            WHERE estado = 'Activo' AND disponibilidad = 'Disponible'
        ");
        return response()->json(['ok' => true, 'estilistas' => $datos]);
    }

    /**
     * Convierte una fecha dd/mm/yyyy (formato del frontend) a yyyy-mm-dd (formato BD).
     * Si ya viene en yyyy-mm-dd la devuelve tal cual.
     */
    private function fechaABd($fecha)
    {
        if (str_contains($fecha, '/')) {
            $partes = explode('/', $fecha);
            return $partes[2] . '-' . str_pad($partes[1], 2, '0', STR_PAD_LEFT) . '-' . str_pad($partes[0], 2, '0', STR_PAD_LEFT);
        }
        return $fecha;
    }

    /**
     * Estilistas que pueden recibir citas "sin preferencia" en una fecha:
     * activos, disponibles y sin bloqueo temporal ese día.
     *
     * @return int[] ids de estilista
     */
    private function estilistasElegibles(Disponibilidad $disp, string $fecha_bd): array
    {
        $estilistas = DB::select("SELECT id_estilista FROM estilista WHERE estado = 'Activo' AND disponibilidad = 'Disponible'");
        return array_values(array_filter(
            array_map(fn($e) => intval($e->id_estilista), $estilistas),
            fn($id) => !$disp->estaBloqueado($id, $fecha_bd)
        ));
    }

    /**
     * Devuelve los horarios de inicio disponibles ("HH:MM") para una cita de
     * `duracion` minutos con un estilista en una fecha. Solo incluye horas en
     * las que la cita completa cabe antes del cierre (17:00) y no se solapa
     * con otra cita del estilista (ver App\Services\Disponibilidad).
     *
     * Si id_estilista = 0 (sin preferencia), un horario está disponible si
     * al menos un estilista elegible está libre en todo ese rango.
     *
     * Parámetros: id_estilista, fecha (dd/mm/yyyy o yyyy-mm-dd), duracion (min).
     */
    public function slots(Request $request, Disponibilidad $disp)
    {
        $id_estilista = intval($request->input('id_estilista'));
        $fecha_bd     = $this->fechaABd($request->input('fecha', ''));
        $duracion     = min(8 * 60, max(Disponibilidad::MINUTOS_SLOT, intval($request->input('duracion'))));

        $ids = $id_estilista === 0 ? $this->estilistasElegibles($disp, $fecha_bd) : [$id_estilista];

        $disponibles = [];
        foreach ($ids as $id) {
            $disponibles = array_merge($disponibles, $disp->horariosDisponibles($id, $fecha_bd, $duracion));
        }
        $disponibles = array_values(array_unique($disponibles));
        sort($disponibles);

        return response()->json(['ok' => true, 'disponibles' => $disponibles]);
    }

    /**
     * Crea las citas de una reserva.
     *
     * Dos casos:
     *   - Con servicios (ej. baño de un Bulldog): una cita por servicio, una
     *     tras otra. Los adicionales van en la primera y suman su tiempo.
     *   - Solo adicionales (ej. solo corte de uñas): UNA cita con el
     *     "Servicio individual" para la mascota elegida (id_mascota_adicionales),
     *     que dura lo de sus adicionales.
     *
     * Usa el id_mascota enviado por el cliente (verificando que sea suya) y
     * valida con las mismas reglas de slots() que el estilista (específico o
     * "Cualquiera") esté libre en todo el rango y termine antes del cierre.
     *
     * Todo se hace dentro de una transacción con los estilistas bloqueados
     * (lockForUpdate): si dos clientes reservan el mismo horario al mismo
     * tiempo, el segundo espera a que el primero termine y luego ve ese
     * horario ocupado. Y si falla la segunda cita de la reserva, la primera
     * también se deshace: no quedan reservas a medias.
     */
    public function crear(Request $request, Disponibilidad $disp)
    {
        $id_cliente   = intval($request->attributes->get('auth_tokenable_id'));
        $id_estilista = intval($request->input('id_estilista'));
        $fecha_bd     = $this->fechaABd((string) $request->input('fecha', ''));
        $hora         = (string) $request->input('hora', '');
        $servicios    = json_decode((string) $request->input('servicios'), true) ?: [];
        $adicionales  = json_decode((string) $request->input('adicionales'), true) ?: [];

        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha_bd) || !preg_match('/^\d{2}:\d{2}(:\d{2})?$/', $hora)) {
            return response()->json(['ok' => false, 'error' => 'Debes seleccionar fecha y hora.']);
        }

        // Solo adicionales que existen (y sin repetidos)
        $adicionales = array_values(array_unique(array_map('intval', (array) $adicionales)));
        if ($adicionales) {
            $marcas = implode(',', array_fill(0, count($adicionales), '?'));
            $existentes = DB::select("SELECT id_adicional FROM adicional WHERE id_adicional IN ($marcas)", $adicionales);
            if (count($existentes) !== count($adicionales)) {
                return response()->json(['ok' => false, 'error' => 'Uno de los adicionales no existe.']);
            }
        }

        // Armar la lista de citas a crear: [id_raza, id_servicio, id_mascota]
        $citas = [];
        if (is_array($servicios) && count($servicios) > 0) {
            foreach ($servicios as $item) {
                $id_raza = intval($item['id_raza'] ?? 0);
                $serv = DB::selectOne("SELECT id_servicio FROM raza_servicio WHERE id_raza = ? LIMIT 1", [$id_raza]);
                if (!$serv) {
                    return response()->json(['ok' => false, 'error' => 'Servicio no encontrado para la raza seleccionada.']);
                }
                $citas[] = [$id_raza, intval($serv->id_servicio), intval($item['id_mascota'] ?? 0)];
            }
        } elseif (count($adicionales) > 0) {
            // Solo adicionales: se usa el "Servicio individual"
            $id_individual = $disp->idServicioIndividual();
            if ($id_individual === null) {
                return response()->json(['ok' => false, 'error' => 'Por ahora no se pueden agendar adicionales solos.']);
            }
            $citas[] = [null, $id_individual, intval($request->input('id_mascota_adicionales'))];
        } else {
            return response()->json(['ok' => false, 'error' => 'Selecciona al menos un servicio o un adicional.']);
        }

        try {
            DB::transaction(function () use ($disp, $id_cliente, $id_estilista, $fecha_bd, $hora, $citas, $adicionales) {
                // Bloquea a los estilistas hasta terminar: las reservas simultáneas van en fila
                DB::table('estilista')->where('estado', 'Activo')->lockForUpdate()->get();

                $horaActualMin   = Disponibilidad::aMinutos($hora);
                $primera_cita_id = null;

                foreach ($citas as [$id_raza, $id_servicio, $id_mascota]) {
                    // Verificar que la mascota sea del cliente y no esté archivada
                    $mascotaValida = DB::selectOne(
                        "SELECT id_mascota FROM mascota WHERE id_mascota = ? AND id_cliente = ? AND activa = 1",
                        [$id_mascota, $id_cliente]
                    );
                    if (!$mascotaValida) {
                        throw new \DomainException('Mascota no válida para este cliente.');
                    }

                    $duracionMin = $disp->duracion($id_raza, $id_servicio);

                    // La primera cita lleva los adicionales: también su tiempo
                    if ($primera_cita_id === null) {
                        $duracionMin += count($adicionales) * Disponibilidad::MINUTOS_ADICIONAL;
                    }

                    $horaStr = Disponibilidad::aHora($horaActualMin);

                    // Asignar estilista
                    $estilistaFinal = $id_estilista;
                    if ($estilistaFinal === 0) {
                        $estilistaFinal = null;
                        foreach ($this->estilistasElegibles($disp, $fecha_bd) as $id) {
                            if ($disp->validarHorario($id, $fecha_bd, $horaStr, $duracionMin) === null) {
                                $estilistaFinal = $id;
                                break;
                            }
                        }
                        if ($estilistaFinal === null) {
                            throw new \DomainException('No hay estilistas disponibles en ese horario. Elige otra hora.');
                        }
                    } else {
                        $error = $disp->validarHorario($estilistaFinal, $fecha_bd, $horaStr, $duracionMin);
                        if ($error !== null) {
                            throw new \DomainException($error);
                        }
                    }

                    $id_cita = DB::table('cita')->insertGetId([
                        'id_cliente'   => $id_cliente,
                        'id_mascota'   => $id_mascota,
                        'id_servicio'  => $id_servicio,
                        'id_raza'      => $id_raza,
                        'id_estilista' => $estilistaFinal,
                        'fecha'        => $fecha_bd,
                        'hora'         => $horaStr,
                        'estado'       => 'Pendiente'
                    ]);

                    if ($primera_cita_id === null) $primera_cita_id = $id_cita;

                    // La siguiente cita empieza cuando termina esta
                    $horaActualMin += $duracionMin;
                }

                // Los adicionales van en la primera cita
                foreach ($adicionales as $id_ad) {
                    DB::table('adicional_cita')->insert([
                        'id_adicional' => $id_ad,
                        'id_cita'      => $primera_cita_id
                    ]);
                }
            });
        } catch (\DomainException $e) {
            // DomainException = errores de validación con mensaje para el cliente
            // (los errores de base de datos son de otro tipo y no se muestran tal cual).
            // Al lanzarse, la transacción ya deshizo todo lo guardado.
            return response()->json(['ok' => false, 'error' => $e->getMessage()]);
        }

        return response()->json(['ok' => true]);
    }
}
