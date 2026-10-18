<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('servicio', function (Blueprint $table) {
            $table->unsignedInteger('id_servicio')->primary();
            $table->string('nombre_servicio', 100);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('servicio');
    }
};