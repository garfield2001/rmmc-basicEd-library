<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('school_year_sections', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('school_year_id')->constrained()->cascadeOnDelete();
            $table->string('year_level', 50)->index();
            $table->string('name', 50);
            $table->timestamps();

            $table->unique(['school_year_id', 'year_level', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('school_year_sections');
    }
};
