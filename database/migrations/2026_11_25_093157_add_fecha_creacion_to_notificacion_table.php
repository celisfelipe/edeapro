
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notificacion', function (Blueprint $table) {
            $table->dateTime('fecha_creacion')
                  ->nullable()
                  ->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::table('notificacion', function (Blueprint $table) {
            $table->dropColumn('fecha_creacion');
        });
    }
};

