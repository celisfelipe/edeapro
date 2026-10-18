<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('raza', function (Blueprint $table) {
            // id_raza es clave primaria pero NO autoincremental
            // En tu BD lo defines tú manualmente (1, 2, 3...)
            $table->unsignedInteger('id_raza')->primary();
            $table->string('nombre_raza', 100);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('raza');
    }
};