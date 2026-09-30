<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class EnviarRecordatoriosCitas extends Command
{
    // Nombre con el que se llama desde la terminal: php artisan citas:recordatorios
    protected $signature   = 'citas:recordatorios';
    protected $description = 'Envía recordatorios por correo 24h antes de cada cita';

    public function handle()
    {
        // Calculamos la ventana de tiempo: entre 23h y 25h desde ahora
        $ahora = now();
        $desde = $ahora->copy()->addHours(23);
        $hasta = $ahora->copy()->addHours(25);

        // Buscamos citas pendientes o reagendadas que caigan en esa ventana
        // La tabla cita ya tiene id_servicio directo, hacemos JOIN a servicio para el nombre
        $citas = DB::select("
            SELECT
                c.id_cita,
                c.fecha,
                c.hora,
                cl.nombre        AS cliente_nombre,
                cl.apellido      AS cliente_apellido,
                cl.correo        AS cliente_correo,
                e.nombre_estilista AS estilista_nombre,
                s.nombre_servicio  AS servicio
            FROM cita c
            JOIN cliente  cl ON cl.id_cliente  = c.id_cliente
            JOIN estilista e ON e.id_estilista  = c.id_estilista
            JOIN servicio  s ON s.id_servicio   = c.id_servicio
            WHERE c.estado IN ('Pendiente', 'Reagendada')
              AND CONCAT(c.fecha, ' ', c.hora) BETWEEN ? AND ?
        ", [
            $desde->format('Y-m-d H:i:s'),
            $hasta->format('Y-m-d H:i:s'),
        ]);

        // Si no hay citas próximas, terminamos
        if (empty($citas)) {
            $this->info('No hay citas próximas para recordar.');
            return;
        }

        // Por cada cita encontrada, enviamos un correo al cliente
        foreach ($citas as $cita) {
            try {
                $nombre   = $cita->cliente_nombre . ' ' . $cita->cliente_apellido;
                $fecha    = date('d/m/Y', strtotime($cita->fecha));

                // Armamos el cuerpo del correo en texto plano
                $cuerpo = "Hola $nombre,\n\n"
                    . "Te recordamos que mañana tienes una cita en EDEA Grooming:\n\n"
                    . "Fecha: $fecha\n"
                    . "Hora: {$cita->hora}\n"
                    . "Estilista: {$cita->estilista_nombre}\n"
                    . "Servicio: {$cita->servicio}\n\n"
                    . "Si necesitas cancelar o reagendar, hazlo con más de 24 horas de anticipación desde tu perfil.\n\n"
                    . "¡Te esperamos!\n"
                    . "Equipo EDEA Grooming";

                // Enviamos usando el SMTP configurado en .env
                Mail::raw($cuerpo, function ($message) use ($cita, $nombre) {
                    $message->to($cita->cliente_correo, $nombre)
                            ->subject('🐾 Recordatorio de tu cita en EDEA Grooming');
                });

                $this->info("Recordatorio enviado a: {$cita->cliente_correo}");

            } catch (\Exception $e) {
                // Si falla un correo, mostramos el error pero continuamos con los demás
                $this->error("Error enviando a {$cita->cliente_correo}: " . $e->getMessage());
            }
        }
    }
}
