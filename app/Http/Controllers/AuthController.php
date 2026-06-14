<?php

/**
 * AuthController
 * ==============
 * Maneja el inicio de sesión y el registro de clientes.
 * Genera tokens de Sanctum para autenticar las peticiones.
 *
 * Ruta login:    POST /api/login
 * Ruta registro: POST /api/registro
 */

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /**
     * Login — verifica correo y contraseña.
     * Genera un token único y lo guarda en personal_access_tokens.
     * Devuelve el rol, los datos del usuario y el token.
     */
    public function login(Request $request)
    {
        $correo     = $request->input('correo');
        $contrasena = $request->input('contrasena');

        // Buscar en tabla cliente
        $cliente = DB::table('cliente')
            ->where('correo', $correo)
            ->where('contrasena', $contrasena)
            ->first();

        if ($cliente) {
            $token = $this->generarToken('cliente', $cliente->id_cliente, 'cliente');
            return response()->json([
                'ok'    => true,
                'rol'   => 'cliente',
                'user'  => $cliente,
                'token' => $token
            ]);
        }

        // Buscar en tabla estilista
        $estilista = DB::table('estilista')
            ->where('correo', $correo)
            ->where('contrasena', $contrasena)
            ->first();

        if ($estilista) {
            $rol   = strtolower($estilista->rol) === 'administrador' ? 'administrador' : 'peluquero';
            $token = $this->generarToken('estilista', $estilista->id_estilista, $rol);
            return response()->json([
                'ok'    => true,
                'rol'   => $rol,
                'user'  => $estilista,
                'token' => $token
            ]);
        }

        return response()->json([
            'ok'    => false,
            'error' => 'Correo o contraseña incorrectos'
        ]);
    }

    /**
     * Genera un token de acceso y lo guarda en personal_access_tokens.
     * @param string $tipo  - 'cliente' o 'estilista'
     * @param int    $id    - id del usuario
     * @param string $rol   - rol del usuario
     * @return string       - token en texto plano para enviar al frontend
     */
    private function generarToken($tipo, $id, $rol)
    {
        // Generar token aleatorio
        $plainToken = Str::random(40);

        // Eliminar tokens anteriores del mismo usuario
        DB::table('personal_access_tokens')
            ->where('tokenable_type', $tipo)
            ->where('tokenable_id', $id)
            ->delete();

        // Guardar el token hasheado en la BD
        DB::table('personal_access_tokens')->insert([
            'tokenable_type' => $tipo,
            'tokenable_id'   => $id,
            'name'           => 'auth_token',
            'token'          => hash('sha256', $plainToken),
            'abilities'      => json_encode([$rol]),
            'expires_at'     => now()->addDays(1),
            'created_at'     => now(),
            'updated_at'     => now()
        ]);

        return $plainToken;
    }

    /**
     * Registro — crea un nuevo cliente con sus mascotas.
     */
    public function registro(Request $request)
    {
        $nombre     = $request->input('nombre');
        $apellido   = $request->input('apellido');
        $telefono   = $request->input('telefono');
        $correo     = $request->input('correo');
        $direccion  = $request->input('direccion', '');
        $contrasena = $request->input('contrasena');
        $mascotas   = json_decode($request->input('mascotas'), true);

        $existe = DB::table('cliente')->where('correo', $correo)->first();
        if ($existe) {
            return response()->json(['ok' => false, 'error' => 'El correo ya está registrado']);
        }

        $id_cliente = DB::table('cliente')->insertGetId([
            'nombre'     => $nombre,
            'apellido'   => $apellido,
            'telefono'   => $telefono,
            'correo'     => $correo,
            'direccion'  => $direccion,
            'contrasena' => $contrasena
        ]);

        if ($mascotas && count($mascotas) > 0) {
            foreach ($mascotas as $mascota) {
                DB::table('mascota')->insert([
                    'id_cliente' => $id_cliente,
                    'nombre'     => $mascota['nombre'],
                    'edad'       => $mascota['edad'],
                    'genero'     => $mascota['genero'],
                    'especie'    => $mascota['tipo']
                ]);
            }
        }

        return response()->json(['ok' => true, 'mensaje' => 'Registro exitoso']);
    }
}
