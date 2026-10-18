<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recuperacion_contrasena', function (Blueprint $table) {
            $table->id(); // columna 'id' autoincremental
            $table->string('correo', 150);
            // token único que se envía al correo del usuario
            $table->string('token', 255);
            // created_at guarda cuándo se generó el token
            // Se usa para expirar el enlace después de X minutos
            $table->timestamp('created_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recuperacion_contrasena');
    }
};