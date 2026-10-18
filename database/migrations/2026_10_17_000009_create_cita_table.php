<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cita', function (Blueprint $table) {
            $table->id('id_cita');

            $table->unsignedBigInteger('id_cliente');
            $table->foreign('id_cliente')
                  ->references('id_cliente')->on('cliente')
                  ->onDelete('cascade');

            $table->unsignedBigInteger('id_mascota');
            $table->foreign('id_mascota')
                  ->references('id_mascota')->on('mascota')
                  ->onDelete('cascade');

            $table->unsignedInteger('id_servicio');
            $table->foreign('id_servicio')
                  ->references('id_servicio')->on('servicio')
                  ->onDelete('restrict'); // no borrar servicios que tengan citas

            // id_raza es nullable: la raza puede no estar definida en la cita
            $table->unsignedInteger('id_raza')->nullable();
            $table->foreign('id_raza')
                  ->references('id_raza')->on('raza')
                  ->onDelete('set null');

            $table->unsignedBigInteger('id_estilista');
            $table->foreign('id_estilista')
                  ->references('id_estilista')->on('estilista')
                  ->onDelete('restrict');

            $table->date('fecha');
            $table->time('hora');
            // estado: 'Pendiente', 'Completada', 'Cancelada'
            $table->string('estado', 50)->default('Pendiente');
            // motivo se usa cuando se cancela la cita
            $table->string('motivo', 255)->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cita');
    }
};