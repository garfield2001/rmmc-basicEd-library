<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('school_year_sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_year_id')->constrained()->cascadeOnDelete();
            $table->string('year_level')->index();
            $table->string('name');
            $table->timestamps();

            $table->unique(['school_year_id', 'year_level', 'name']);
        });

        Schema::table('student_enrollments', function (Blueprint $table) {
            $table->foreignId('school_year_section_id')
                ->nullable()
                ->after('school_year_id')
                ->constrained('school_year_sections')
                ->nullOnDelete();
        });

        DB::table('student_enrollments')
            ->select('school_year_id', 'year_level', 'section')
            ->distinct()
            ->orderBy('school_year_id')
            ->get()
            ->each(function (object $enrollment): void {
                if (! $enrollment->section) {
                    return;
                }

                $now = now();
                $sectionId = DB::table('school_year_sections')->insertGetId([
                    'school_year_id' => $enrollment->school_year_id,
                    'year_level' => $enrollment->year_level,
                    'name' => $enrollment->section,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);

                DB::table('student_enrollments')
                    ->where('school_year_id', $enrollment->school_year_id)
                    ->where('year_level', $enrollment->year_level)
                    ->where('section', $enrollment->section)
                    ->update(['school_year_section_id' => $sectionId]);
            });
    }

    public function down(): void
    {
        Schema::table('student_enrollments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('school_year_section_id');
        });

        Schema::dropIfExists('school_year_sections');
    }
};
