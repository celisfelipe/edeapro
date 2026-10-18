<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('resena', function (Blueprint $table) {
            $table->id('id_resena');

            // Si se borra el cliente, se borran sus reseñas (cascade)
            $table->unsignedBigInteger('id_cliente');
            $table->foreign('id_cliente')
                  ->references('id_cliente')->on('cliente')
                  ->onDelete('cascade');

            // puntuacion: solo permite valores entre 1 y 5
            // CHECK se agrega con ->check() pero Laravel lo soporta en MySQL 8+
            $table->unsignedTinyInteger('puntuacion'); // 0-255, suficiente para 1-5

            $table->text('comentario')->nullable();

            // fecha con valor por defecto = momento en que se inserta
            $table->timestamp('fecha')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('resena');
    }
};