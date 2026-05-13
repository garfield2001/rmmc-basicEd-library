<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_school_year_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('registered_visitor_id')->constrained()->cascadeOnDelete();
            $table->foreignId('school_year_id')->constrained()->cascadeOnDelete();
            $table->string('year_level', 50)->index();
            $table->string('section', 50)->nullable()->index();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['registered_visitor_id', 'school_year_id']);
            $table->index(['school_year_id', 'year_level', 'section']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_school_year_records');
    }
};
