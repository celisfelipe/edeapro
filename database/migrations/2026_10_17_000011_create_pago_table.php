<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pago', function (Blueprint $table) {
            $table->id('id_pago');

            $table->unsignedBigInteger('id_cita');
            $table->foreign('id_cita')
                  ->references('id_cita')->on('cita')
                  ->onDelete('cascade');

            $table->decimal('monto', 10, 2);
            $table->date('fecha_pago');
            // metodo_pago: 'Efectivo', 'Tarjeta', 'Transferencia', etc.
            $table->string('metodo_pago', 50);
            // estado_pago: 'Pendiente', 'Pagado', 'Reembolsado', etc.
            $table->string('estado_pago', 50)->default('Pendiente');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pago');
    }
};