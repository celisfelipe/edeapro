<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('promocion', function (Blueprint $table) {
            $table->unsignedInteger('id_promocion')->primary();
            $table->string('nombre_promocion', 100);
            // decimal(5,2): valores hasta 999.99 — ideal para porcentajes o descuentos
            $table->decimal('valor_promocion', 5, 2);
            $table->string('estado_promocion', 50);
            $table->string('tipo_promocion', 50);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('promocion');
    }
};