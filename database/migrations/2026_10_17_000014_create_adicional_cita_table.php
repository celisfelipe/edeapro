<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('adicional_cita', function (Blueprint $table) {
            $table->unsignedInteger('id_adicional');
            $table->unsignedBigInteger('id_cita');

            // Clave primaria compuesta: un mismo adicional no se repite en la misma cita
            $table->primary(['id_adicional', 'id_cita']);

            $table->foreign('id_adicional')
                  ->references('id_adicional')->on('adicional')
                  ->onDelete('cascade');

            $table->foreign('id_cita')
                  ->references('id_cita')->on('cita')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('adicional_cita');
    }
};