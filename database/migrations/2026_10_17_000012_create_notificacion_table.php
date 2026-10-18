<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notificacion', function (Blueprint $table) {
            $table->unsignedInteger('id_notificacion')->primary();

            $table->unsignedBigInteger('id_cita');
            $table->foreign('id_cita')
                  ->references('id_cita')->on('cita')
                  ->onDelete('cascade');

            $table->unsignedBigInteger('id_cliente');
            $table->foreign('id_cliente')
                  ->references('id_cliente')->on('cliente')
                  ->onDelete('cascade');

            $table->text('mensaje');
            // tipo: 'confirmacion', 'recordatorio', 'cancelacion', etc.
            $table->string('tipo', 50);
            $table->string('titulo', 150);
            // estado: 'leida' / 'no_leida'
            $table->string('estado', 50)->default('no_leida');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notificacion');
    }
};