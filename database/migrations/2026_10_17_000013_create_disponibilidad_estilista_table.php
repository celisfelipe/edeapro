<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('disponibilidad_estilista', function (Blueprint $table) {
            $table->id('id_disponibilidad');

            $table->unsignedBigInteger('id_estilista');
            $table->foreign('id_estilista')
                  ->references('id_estilista')->on('estilista')
                  ->onDelete('cascade');

            // fecha_inicio y fecha_fin definen el rango del bloqueo
            $table->date('fecha_inicio');
            $table->date('fecha_fin');
            $table->string('motivo', 255)->nullable();

            // creado_en: cuándo se registró el bloqueo
            $table->timestamp('creado_en')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('disponibilidad_estilista');
    }
};