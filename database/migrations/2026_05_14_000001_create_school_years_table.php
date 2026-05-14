<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('school_years', function (Blueprint $table): void {
            $table->id();
            $table->string('name', 32)->unique();
            $table->date('starts_at');
            $table->date('ends_at');
            $table->unsignedTinyInteger('student_required_visits')->default(4);
            $table->unsignedTinyInteger('employee_required_visits')->default(4);
            $table->boolean('is_active')->default(false)->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('school_years');
    }
};
