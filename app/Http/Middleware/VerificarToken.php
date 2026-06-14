<?php

/**
 * VerificarToken — Middleware de Autenticación
 * =============================================
 * Verifica que cada petición a rutas protegidas
 * incluya un token válido en el header Authorization.
 *
 * El token se genera al hacer login y se guarda en localStorage.
 * El frontend lo envía en cada fetch como: Bearer {token}
 *
 * Si el token no existe o expiró → devuelve error 401
 * Si el token es válido → deja pasar la petición
 */

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VerificarToken
{
    public function handle(Request $request, Closure $next)
    {
        // Obtener el token del header Authorization
        // El frontend lo envía como: "Bearer abc123..."
        $authHeader = $request->header('Authorization');

        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return response()->json([
                'ok'    => false,
                'error' => 'No autorizado — token no proporcionado'
            ], 401);
        }

        // Extraer el token puro sin el prefijo "Bearer "
        $plainToken = substr($authHeader, 7);

        // Buscar el token hasheado en la base de datos
        $token = DB::table('personal_access_tokens')
            ->where('token', hash('sha256', $plainToken))
            ->first();

        // Verificar que el token existe y no ha expirado
        if (!$token) {
            return response()->json([
                'ok'    => false,
                'error' => 'No autorizado — token inválido'
            ], 401);
        }

        if ($token->expires_at && now()->isAfter($token->expires_at)) {
            return response()->json([
                'ok'    => false,
                'error' => 'No autorizado — sesión expirada'
            ], 401);
        }

        // Token válido — dejar pasar la petición
        return $next($request);
    }
}
