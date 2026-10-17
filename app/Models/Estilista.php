<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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
}
