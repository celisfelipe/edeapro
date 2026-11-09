<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * CorsMiddleware
 * ==============
 * Agrega los encabezados CORS: le dice al navegador qué sitio puede
 * llamar a esta API. Como las páginas las sirve el mismo Laravel, en
 * la práctica es la misma dirección (FRONTEND_URL en el .env).
 */

class CorsMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        // Única dirección autorizada a llamar la API desde otro sitio.
        // Se lee con config() (no env()) para que funcione con config:cache.
        $origen = config('app.frontend_url');

        if ($request->isMethod('OPTIONS')) {
            return response('', 200)
                ->header('Access-Control-Allow-Origin', $origen)
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        }

        $response = $next($request);
        $response->headers->set('Access-Control-Allow-Origin', $origen);
        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return $response;
    }
}