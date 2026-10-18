<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mascota', function (Blueprint $table) {
            $table->id('id_mascota');

            // FK hacia cliente — si se borra el cliente, se borran sus mascotas
            $table->unsignedBigInteger('id_cliente');
            $table->foreign('id_cliente')
                  ->references('id_cliente')->on('cliente')
                  ->onDelete('cascade');

            // FK hacia raza — nullable porque podría no conocerse la raza
            $table->unsignedInteger('id_raza')->nullable();
            $table->foreign('id_raza')
                  ->references('id_raza')->on('raza')
                  ->onDelete('set null');

            $table->string('nombre', 100);
            $table->string('especie', 50);
            $table->integer('edad')->nullable();
            $table->string('genero', 10)->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mascota');
    }
};