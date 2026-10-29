<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class RecuperacionController extends Controller
{
    /**
     * Recibe el correo, genera un token y envía el email.
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

        // Eliminar tokens anteriores del mismo correo
        DB::table('recuperacion_contrasena')->where('correo', $correo)->delete();

        // Generar token único
        $token = Str::random(64);

        // Guardar token en la BD
        DB::table('recuperacion_contrasena')->insert([
            'correo'     => $correo,
            'token'      => $token,
            'created_at' => now()
        ]);

        // Enlace de recuperación
        $enlace = env('FRONTEND_URL') . "/edeapro/paginas/nueva-contrasena.html?token={$token}&correo=" . urlencode($correo);

        // Enviar email
        Mail::raw(
            "Hola,\n\nRecibimos una solicitud para restablecer tu contraseña de EDEA PRO.\n\nHaz clic en el siguiente enlace para crear una nueva contraseña (válido por 15 minutos):\n\n{$enlace}\n\nSi no solicitaste esto, ignora este mensaje.\n\nEDEA PRO",
            function ($message) use ($correo) {
                $message->to($correo)->subject('Recuperar contraseña — EDEA PRO');
            }
        );

        return response()->json(['ok' => true, 'mensaje' => 'Correo enviado. Revisa tu bandeja de entrada.']);
    }

    /**
     * Recibe el token y la nueva contraseña y la actualiza en la BD.
     */
    public function restablecerContrasena(Request $request)
    {
        $correo      = filter_var(trim($request->input('correo')), FILTER_SANITIZE_EMAIL);
        $token       = trim($request->input('token'));
        $contrasena  = $request->input('contrasena');

        if (!$contrasena || strlen($contrasena) < 8) {
            return response()->json(['ok' => false, 'error' => 'La contraseña debe tener al menos 8 caracteres.']);
        }

        // Verificar que el token exista y no haya expirado (15 minutos)
        $registro = DB::table('recuperacion_contrasena')
            ->where('correo', $correo)
            ->where('token', $token)
            ->first();

        if (!$registro) {
            return response()->json(['ok' => false, 'error' => 'Token inválido o expirado.']);
        }

        $expiracion = strtotime($registro->created_at) + (15 * 60);
        if (time() > $expiracion) {
            DB::table('recuperacion_contrasena')->where('correo', $correo)->delete();
            return response()->json(['ok' => false, 'error' => 'El enlace ha expirado. Solicita uno nuevo.']);
        }

        $nueva = Hash::make($contrasena);

        // Actualizar en cliente o estilista
        $cliente = DB::table('cliente')->where('correo', $correo)->first();
        if ($cliente) {
            DB::table('cliente')->where('correo', $correo)->update(['contrasena' => $nueva]);
        } else {
            DB::table('estilista')->where('correo', $correo)->update(['contrasena' => $nueva]);
        }

        // Verificar que no haya más de 3 intentos en la última hora
        $intentos = DB::table('recuperacion_contrasena')
            ->where('correo', $correo)
            ->where('created_at', '>=', now()->subHour())
            ->count();

        if ($intentos >= 3) {
            return response()->json(['ok' => false, 'error' => 'Demasiados intentos. Espera una hora antes de intentar de nuevo.']);
        }

        // Eliminar tokens anteriores del mismo correo
        DB::table('recuperacion_contrasena')->where('correo', $correo)->delete();

        // Cerrar todas las sesiones activas de este usuario
        $tabla     = $cliente ? 'cliente' : 'estilista';
        $id_campo  = $cliente ? 'id_cliente' : 'id_estilista';
        $id_valor  = $cliente ? $cliente->id_cliente : DB::table('estilista')->where('correo', $correo)->first()->id_estilista;

        DB::table('personal_access_tokens')
            ->where('tokenable_type', $tabla)
            ->where('tokenable_id', $id_valor)
            ->delete();

        return response()->json(['ok' => true, 'mensaje' => 'Contraseña actualizada correctamente.']);
        }
}
