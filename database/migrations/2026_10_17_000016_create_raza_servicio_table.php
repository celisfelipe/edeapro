<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('raza_servicio', function (Blueprint $table) {
            $table->unsignedInteger('id_servicio');
            $table->unsignedInteger('id_raza');

            // Clave primaria compuesta
            $table->primary(['id_servicio', 'id_raza']);

            $table->foreign('id_servicio')
                  ->references('id_servicio')->on('servicio')
                  ->onDelete('cascade');

            $table->foreign('id_raza')
                  ->references('id_raza')->on('raza')
                  ->onDelete('cascade');

            // Esta tabla no es solo pivote — tiene datos propios
            // El precio y duración varían según la combinación raza+servicio
            $table->text('descripcion')->nullable();
            $table->integer('duracion')->nullable(); // duración en minutos
            $table->decimal('precio', 10, 2);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('raza_servicio');
    }
};