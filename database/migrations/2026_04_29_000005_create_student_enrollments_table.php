<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_enrollments', function (Blueprint $table) {
            $table->engine = 'InnoDB';

            $table->id();
            $table->foreignId('library_member_id')->constrained()->cascadeOnDelete();
            $table->foreignId('school_year_id')->constrained()->cascadeOnDelete();
            $table->string('year_level', 50)->index();
            $table->string('section', 50)->nullable()->index();
            $table->timestamps();

            $table->unique(['library_member_id', 'school_year_id']);
            $table->index(['school_year_id', 'year_level', 'section']);
        });

        if (Schema::hasTable('students')) {
            $activeSchoolYearId = DB::table('school_years')->where('is_active', true)->value('id');

            if ($activeSchoolYearId) {
                DB::table('students')
                    ->orderBy('id')
                    ->get()
                    ->each(function (object $student) use ($activeSchoolYearId): void {
                        DB::table('student_enrollments')->insertOrIgnore([
                            'library_member_id' => $student->library_member_id,
                            'school_year_id' => $activeSchoolYearId,
                            'year_level' => $student->year_level,
                            'section' => $student->section,
                            'created_at' => $student->created_at,
                            'updated_at' => $student->updated_at,
                        ]);
                    });
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('student_enrollments');
    }
};
