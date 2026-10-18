<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cliente_promocion', function (Blueprint $table) {
            $table->unsignedBigInteger('id_cliente');
            $table->unsignedInteger('id_promocion');

            $table->primary(['id_cliente', 'id_promocion']);

            $table->foreign('id_cliente')
                  ->references('id_cliente')->on('cliente')
                  ->onDelete('cascade');

            $table->foreign('id_promocion')
                  ->references('id_promocion')->on('promocion')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cliente_promocion');
    }
};