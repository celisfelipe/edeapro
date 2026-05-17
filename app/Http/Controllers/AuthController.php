<?php

/**
 * AuthController
 * ==============
 * Maneja el inicio de sesión y el registro de clientes.
 * Recibe los datos del formulario en login.html (login.js).
 *
 * Ruta login:    POST /api/login
 * Ruta registro: POST /api/registro
 */

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AuthController extends Controller
{
    /**
     * Login — verifica correo y contraseña.
     * Busca primero en la tabla 'cliente', luego en 'estilista'.
     * Devuelve el rol ('cliente', 'administrador' o 'peluquero')
     * y los datos del usuario para guardar en localStorage.
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
            return response()->json([
                'ok'   => true,
                'rol'  => 'cliente',
                'user' => $cliente
            ]);
        }

        // Buscar en tabla estilista (admin o peluquero)
        $estilista = DB::table('estilista')
            ->where('correo', $correo)
            ->where('contrasena', $contrasena)
            ->first();

        if ($estilista) {
            $rol = strtolower($estilista->rol) === 'administrador' ? 'administrador' : 'peluquero';
            return response()->json([
                'ok'   => true,
                'rol'  => $rol,
                'user' => $estilista
            ]);
        }

        return response()->json([
            'ok'    => false,
            'error' => 'Correo o contraseña incorrectos'
        ]);
    }

    /**
     * Registro — crea un nuevo cliente con sus mascotas.
     * Valida que el correo no esté ya registrado.
     * Inserta en las tablas 'cliente' y 'mascota'.
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

        // Verificar si el correo ya existe
        $existe = DB::table('cliente')->where('correo', $correo)->first();
        if ($existe) {
            return response()->json(['ok' => false, 'error' => 'El correo ya está registrado']);
        }

        // Insertar cliente
        $id_cliente = DB::table('cliente')->insertGetId([
            'nombre'     => $nombre,
            'apellido'   => $apellido,
            'telefono'   => $telefono,
            'correo'     => $correo,
            'direccion'  => $direccion,
            'contrasena' => $contrasena
        ]);

        // Insertar mascotas asociadas al cliente
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
