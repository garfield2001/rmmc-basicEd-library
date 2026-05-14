<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_registrations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('registered_visitor_id')->constrained()->cascadeOnDelete();
            $table->foreignId('school_year_id')->constrained()->cascadeOnDelete();
            $table->foreignId('school_year_section_id')->nullable()->constrained('school_year_sections')->nullOnDelete();
            $table->string('school_id')->nullable()->index();
            $table->string('rfid_uid', 10)->nullable();
            $table->string('first_name')->nullable();
            $table->string('middle_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('photo')->nullable();
            $table->string('year_level', 50)->index();
            $table->string('section', 50)->nullable()->index();
            $table->timestamps();

            $table->unique(['registered_visitor_id', 'school_year_id'], 'student_registration_year_unique');
            $table->index(['school_year_id', 'year_level', 'section'], 'student_registration_group_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_registrations');
    }
};
