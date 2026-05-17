<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Historical filename retained so existing installs do not rerun this migration after the schema rename.
        Schema::create('employee_school_year_records', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('library_member_id')->constrained()->cascadeOnDelete();
            $table->foreignId('school_year_id')->constrained()->cascadeOnDelete();
            $table->string('school_id')->nullable()->index();
            $table->string('rfid_uid', 10)->nullable();
            $table->string('first_name')->nullable();
            $table->string('middle_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('photo')->nullable();
            $table->string('department')->index();
            $table->timestamps();

            $table->unique(['library_member_id', 'school_year_id'], 'employee_school_year_record_unique');
            $table->index(['school_year_id', 'department']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_school_year_records');
        Schema::dropIfExists('employee_profiles');
    }
};
