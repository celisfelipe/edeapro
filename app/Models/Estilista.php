<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Estilista extends Model
{
    // Le decimos a Laravel el nombre real de la tabla
    // porque por defecto buscaría "estilistas" (con s)
    protected $table = 'estilista';

    // La clave primaria no es "id" sino "id_estilista"
    protected $primaryKey = 'id_estilista';

    // No usamos created_at / updated_at porque tu tabla no los tiene
    public $timestamps = false;

    // Columnas que se pueden llenar masivamente (al crear/editar)
    protected $fillable = [
        'nombre_estilista',
        'apellido_estilista',
        'telefono_estilista',
        'rol',
        'estado',
        'disponibilidad',
        'correo',
        'contrasena',
        'foto',
    ];

    /**
     * Convierte la ruta guardada en la columna foto (ej. "fotos/abc.jpg") en una
     * URL completa, o null si el archivo no existe en este PC. Así el frontend
     * muestra las iniciales en vez de una imagen rota cuando la BD apunta a una
     * foto que no se copió. La URL usa el host de la petición actual, por lo que
     * sirve igual con localhost o 127.0.0.1 en cualquier equipo.
     *
     * Es estática para poder usarla también con los resultados de DB::select().
     */
    public static function urlFoto(?string $foto): ?string
    {
        if (!$foto || !Storage::disk('uploads')->exists($foto)) {
            return null;
        }

        return asset('uploads/' . $foto);
    }
}
