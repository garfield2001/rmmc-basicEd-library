<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('library_visits', function (Blueprint $table) {
            if (Schema::hasColumn('library_visits', 'recorded_by')) {
                $table->dropConstrainedForeignId('recorded_by');
            }
        });
    }

    public function down(): void
    {
        Schema::table('library_visits', function (Blueprint $table) {
            if (! Schema::hasColumn('library_visits', 'recorded_by')) {
                $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete()->after('school_year_id');
            }
        });
    }
};
