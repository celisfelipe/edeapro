<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class RecuperacionController extends Controller
{
    /**
     * Recibe el correo, genera un token y envía el email.
     * Máximo 3 solicitudes por hora por correo.
     */
    public function enviarToken(Request $request)
{
    $correo = filter_var(trim($request->input('correo')), FILTER_SANITIZE_EMAIL);

    // Verificar si el correo existe en clientes o estilistas
    $cliente   = DB::table('cliente')->where('correo', $correo)->first();
    $estilista = DB::table('estilista')->where('correo', $correo)->first();

    if (!$cliente && !$estilista) {
        return response()->json(['ok' => false, 'error' => 'No existe una cuenta con ese correo.']);
    }

    // Verificar que no haya más de 3 solicitudes en la última hora
    $intentos = DB::table('recuperacion_contrasena')
        ->where('correo', $correo)
        ->where('created_at', '>=', now()->subHour())
        ->count();

    if ($intentos >= 3) {
        return response()->json(['ok' => false, 'error' => 'Demasiados intentos. Espera una hora antes de intentar de nuevo.']);
    }

    // Generar token único y guardarlo (sin borrar los anteriores para que el contador funcione)
    $token = Str::random(64);

    DB::table('recuperacion_contrasena')->insert([
        'correo'     => $correo,
        'token'      => $token,
        'created_at' => now()
    ]);

    // Enlace de recuperación
    $enlace = config('app.frontend_url') . "/edeapro/paginas/nueva-contrasena.html?token={$token}&correo=" . urlencode($correo);

        // Enviar el correo con la API de Brevo (por HTTPS, no por SMTP).
    // Si falla, se borra el token recién creado: así este intento no cuenta
    // en el límite de 3 por hora y el usuario ve un mensaje claro.
    try {
        $respuesta = Http::withHeaders(['api-key' => config('services.brevo.key')])
            ->timeout(15)
            ->post('https://api.brevo.com/v3/smtp/email', [
                'sender'      => ['name' => 'EDEA PRO', 'email' => config('services.brevo.remitente')],
                'to'          => [['email' => $correo]],
                'subject'     => 'Recuperar contraseña — EDEA PRO',
                'textContent' => "Hola,\n\nRecibimos una solicitud para restablecer tu contraseña de EDEA PRO.\n\nHaz clic en el siguiente enlace para crear una nueva contraseña (válido por 15 minutos):\n\n{$enlace}\n\nSi no solicitaste esto, ignora este mensaje.\n\nEDEA PRO",
            ]);
        $enviado = $respuesta->successful();
        if (!$enviado) {
            report(new \RuntimeException('Brevo respondió ' . $respuesta->status() . ': ' . $respuesta->body()));
        }
    } catch (\Throwable $e) {
        report($e);
        $enviado = false;
    }

    if (!$enviado) {
        DB::table('recuperacion_contrasena')->where('token', $token)->delete();
        return response()->json([
            'ok'    => false,
            'error' => 'No se pudo enviar el correo en este momento. Intenta más tarde.'
        ]);
    }

    return response()->json(['ok' => true, 'mensaje' => 'Correo enviado. Revisa tu bandeja de entrada.']);
}

    /**
     * Recibe el token y la nueva contraseña y la actualiza en la BD.
     */
    public function restablecerContrasena(Request $request)
    {
        $correo     = filter_var(trim($request->input('correo')), FILTER_SANITIZE_EMAIL);
        $token      = trim($request->input('token'));
        $contrasena = $request->input('contrasena');

        // Mismas reglas que el registro: mínimo 8 caracteres, una mayúscula y un número
        if (!$contrasena || !preg_match('/^(?=.*[A-Z])(?=.*\d).{8,}$/', $contrasena)) {
            return response()->json(['ok' => false, 'error' => 'La contraseña debe tener al menos 8 caracteres, una mayúscula y un número.']);
        }

        // Verificar que el token exista
        $registro = DB::table('recuperacion_contrasena')
            ->where('correo', $correo)
            ->where('token', $token)
            ->first();

        if (!$registro) {
            return response()->json(['ok' => false, 'error' => 'Token inválido o expirado.']);
        }

        // Verificar que no haya expirado (15 minutos)
        $expiracion = strtotime($registro->created_at) + (15 * 60);
        if (time() > $expiracion) {
            DB::table('recuperacion_contrasena')->where('correo', $correo)->delete();
            return response()->json(['ok' => false, 'error' => 'El enlace ha expirado. Solicita uno nuevo.']);
        }

        // Actualizar contraseña en cliente o estilista
        $nueva   = Hash::make($contrasena);
        $cliente = DB::table('cliente')->where('correo', $correo)->first();
        if ($cliente) {
            DB::table('cliente')->where('correo', $correo)->update(['contrasena' => $nueva]);
        } else {
            DB::table('estilista')->where('correo', $correo)->update(['contrasena' => $nueva]);
        }

        // Eliminar el token para que no se pueda reusar
        DB::table('recuperacion_contrasena')->where('correo', $correo)->delete();

        // Cerrar todas las sesiones activas del usuario
        $tabla    = $cliente ? 'cliente' : 'estilista';
        $id_valor = $cliente
            ? $cliente->id_cliente
            : DB::table('estilista')->where('correo', $correo)->first()->id_estilista;

        DB::table('personal_access_tokens')
            ->where('tokenable_type', $tabla)
            ->where('tokenable_id', $id_valor)
            ->delete();

        return response()->json(['ok' => true, 'mensaje' => 'Contraseña actualizada correctamente.']);
    }
}
