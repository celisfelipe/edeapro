<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    
    public function up(): void
    {
        Schema::table('estilista', function (Blueprint $table) {
            $table->string('foto')->nullable()->after('apellido_estilista');
        });
    }

    
    public function down(): void
    {
        Schema::table('estilista', function (Blueprint $table) {
            $table->dropColumn('foto');
        });
    }
};
