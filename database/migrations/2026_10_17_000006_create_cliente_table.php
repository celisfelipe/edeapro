<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cliente', function (Blueprint $table) {
            $table->id('id_cliente');
            $table->string('nombre', 100);
            $table->string('apellido', 100);
            $table->string('contrasena', 255);
            $table->string('telefono', 20)->nullable();
            $table->string('correo', 150)->unique();
            $table->string('direccion', 255)->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cliente');
    }
};