<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('school_years', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->date('starts_at');
            $table->date('ends_at');
            $table->unsignedTinyInteger('minimum_visits')->default(3);
            $table->unsignedTinyInteger('target_visits')->default(4);
            $table->boolean('is_active')->default(false)->index();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('school_years');
    }
};
