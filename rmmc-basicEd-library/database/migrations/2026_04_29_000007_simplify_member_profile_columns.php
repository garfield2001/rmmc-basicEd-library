<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('library_members', function (Blueprint $table) {
            if (! Schema::hasColumn('library_members', 'photo')) {
                $table->string('photo')->nullable()->after('last_name');
            }
        });

        Schema::table('students', function (Blueprint $table) {
            if (Schema::hasColumn('students', 'strand')) {
                $table->dropColumn('strand');
            }

            if (Schema::hasColumn('students', 'guardian_name')) {
                $table->dropColumn('guardian_name');
            }

            if (Schema::hasColumn('students', 'guardian_contact')) {
                $table->dropColumn('guardian_contact');
            }
        });

        Schema::table('employees', function (Blueprint $table) {
            if (Schema::hasColumn('employees', 'position')) {
                $table->dropColumn('position');
            }

            if (Schema::hasColumn('employees', 'employment_type')) {
                $table->dropColumn('employment_type');
            }
        });
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            if (! Schema::hasColumn('employees', 'position')) {
                $table->string('position')->nullable()->index()->after('department');
            }

            if (! Schema::hasColumn('employees', 'employment_type')) {
                $table->string('employment_type')->nullable()->index()->after('position');
            }
        });

        Schema::table('students', function (Blueprint $table) {
            if (! Schema::hasColumn('students', 'strand')) {
                $table->string('strand')->nullable()->index()->after('section');
            }

            if (! Schema::hasColumn('students', 'guardian_name')) {
                $table->string('guardian_name')->nullable()->after('strand');
            }

            if (! Schema::hasColumn('students', 'guardian_contact')) {
                $table->string('guardian_contact')->nullable()->after('guardian_name');
            }
        });

        Schema::table('library_members', function (Blueprint $table) {
            if (Schema::hasColumn('library_members', 'photo')) {
                $table->dropColumn('photo');
            }
        });
    }
};
