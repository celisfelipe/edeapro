<?php

/**
 * AuthController
 * ==============
 * Maneja el inicio de sesión y el registro de clientes.
 *
 * Ruta login:    POST /api/login
 * Ruta registro: POST /api/registro
 *
 * SEGURIDAD IMPLEMENTADA:
 * - Validación de datos de entrada
 * - Sanitización de datos
 * - Contraseñas hasheadas con bcrypt
 * - Tokens de autenticación
 * - Rate limiting en rutas
 */

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * Login — verifica correo y contraseña hasheada.
     * Genera un token y lo guarda en personal_access_tokens.
     */
    public function login(Request $request)
    {
        // Validar que los campos no vengan vacíos y con formato correcto
        $request->validate([
        'correo'     => 'required|email',
        'contrasena' => ['required', 'min:8', 'regex:/^(?=.*[A-Z])(?=.*\d).{8,}$/']
        ]);

        // Sanitizar datos de entrada
        $correo     = filter_var(trim($request->input('correo')), FILTER_SANITIZE_EMAIL);
        $contrasena = $request->input('contrasena');

        // Buscar cliente por correo
        $cliente = DB::table('cliente')
            ->where('correo', $correo)
            ->first();

        // Verificar contraseña con bcrypt
        if ($cliente && Hash::check($contrasena, $cliente->contrasena)) {
            $token = $this->generarToken('cliente', $cliente->id_cliente, 'cliente');
            return response()->json([
                'ok'    => true,
                'rol'   => 'cliente',
                'user'  => $cliente,
                'token' => $token
            ]);
        }

        // Buscar estilista por correo
        $estilista = DB::table('estilista')
            ->where('correo', $correo)
            ->first();

        // Verificar contraseña con bcrypt
        if ($estilista && Hash::check($contrasena, $estilista->contrasena)) {
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
     * Genera un token único y lo guarda en personal_access_tokens.
     * Elimina tokens anteriores del mismo usuario antes de crear uno nuevo.
     */
    private function generarToken($tipo, $id, $rol)
    {
        $plainToken = Str::random(40);

        // Eliminar tokens anteriores del mismo usuario
        DB::table('personal_access_tokens')
            ->where('tokenable_type', $tipo)
            ->where('tokenable_id', $id)
            ->delete();

        // Guardar token hasheado en la BD
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
     * Sanitiza y hashea la contraseña antes de guardar.
     */
    public function registro(Request $request)
    {
        // Validar datos del registro
        $request->validate([
    'nombre'     => ['required', 'string', 'max:100', 'regex:/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,}$/'],
    'apellido'   => ['required', 'string', 'max:100', 'regex:/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,}$/'],
    'correo'     => 'required|email|max:150',
    'telefono'   => ['required', 'regex:/^\d{10}$/'],
    'contrasena' => ['required', 'min:8', 'regex:/^(?=.*[A-Z])(?=.*\d).{8,}$/']
    ]);

        // Sanitizar — limpiar espacios extra y caracteres peligrosos
        $nombre     = strip_tags(trim($request->input('nombre')));
        $apellido   = strip_tags(trim($request->input('apellido')));
        $telefono   = strip_tags(trim($request->input('telefono')));
        $correo     = filter_var(trim($request->input('correo')), FILTER_SANITIZE_EMAIL);
        $direccion  = strip_tags(trim($request->input('direccion', '')));
        $contrasena = $request->input('contrasena');
        $mascotas   = json_decode($request->input('mascotas'), true);

        // Verificar si el correo ya existe
        $existe = DB::table('cliente')->where('correo', $correo)->first();
        if ($existe) {
            return response()->json(['ok' => false, 'error' => 'El correo ya está registrado']);
        }

        // Insertar cliente con contraseña hasheada
        $id_cliente = DB::table('cliente')->insertGetId([
            'nombre'     => $nombre,
            'apellido'   => $apellido,
            'telefono'   => $telefono,
            'correo'     => $correo,
            'direccion'  => $direccion,
            'contrasena' => Hash::make($contrasena)
        ]);

        // Insertar mascotas asociadas al cliente
        if ($mascotas && count($mascotas) > 0) {
            foreach ($mascotas as $mascota) {
                DB::table('mascota')->insert([
                    'id_cliente' => $id_cliente,
                    'nombre'     => strip_tags(trim($mascota['nombre'])),
                    'edad'       => intval($mascota['edad']),
                    'genero'     => strip_tags(trim($mascota['genero'])),
                    'especie'    => strip_tags(trim($mascota['tipo']))
                ]);
            }
        }

        return response()->json(['ok' => true, 'mensaje' => 'Registro exitoso']);
    }
}
