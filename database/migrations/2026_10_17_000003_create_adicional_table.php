<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('adicional', function (Blueprint $table) {
            $table->unsignedInteger('id_adicional')->primary();
            $table->string('nombre_adicional', 100);
            // decimal(10,2): hasta 10 dígitos en total, 2 después del punto
            // Ej: 99999999.99 — suficiente para cualquier precio
            $table->decimal('precio_adicional', 10, 2);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('adicional');
    }
};