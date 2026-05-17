<?php

/**
 * CorsMiddleware
 * ==============
 * Permite que el frontend (edeapro/) pueda hacer peticiones fetch() a Laravel.
 * Sin esto el navegador bloquearía las peticiones por la política de seguridad CORS.
 *
 * CORS = Cross-Origin Resource Sharing
 * El frontend corre en localhost y Laravel en 127.0.0.1:8000,
 * por eso se necesita este middleware para que el navegador los acepte.
 *
 * Se registra en bootstrap/app.php como middleware global de la API.
 */

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CorsMiddleware
{
    /**
     * Agrega los headers de CORS a cada respuesta de la API.
     * El bloque OPTIONS responde inmediatamente al "preflight" del navegador
     * (verificación previa que hace el navegador antes de cada fetch POST).
     */
    public function handle(Request $request, Closure $next)
    {
        // Responder al preflight OPTIONS sin llegar al controlador
        if ($request->isMethod('OPTIONS')) {
            return response('', 200)
                ->header('Access-Control-Allow-Origin', '*')
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        }

        // Agregar headers CORS a la respuesta normal
        $response = $next($request);
        $response->headers->set('Access-Control-Allow-Origin', '*');
        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return $response;
    }
}
