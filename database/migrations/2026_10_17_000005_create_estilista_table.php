<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('estilista', function (Blueprint $table) {
            // id_estilista SÍ es autoincremental (AI en tu BD original)
            $table->id('id_estilista');
            $table->string('nombre_estilista', 100);
            $table->string('apellido_estilista', 100);
            // foto guarda solo la ruta o nombre del archivo, no la imagen en sí
            $table->string('foto', 255)->nullable();
            $table->string('telefono_estilista', 20)->nullable();
            $table->string('rol', 50);
            $table->string('estado', 50);
            $table->string('disponibilidad', 50)->nullable();
            $table->string('correo', 150)->unique();
            $table->string('contrasena', 255);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('estilista');
    }
};