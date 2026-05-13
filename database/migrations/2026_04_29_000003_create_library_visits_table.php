<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('library_visits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('registered_visitor_id')->constrained()->cascadeOnDelete();
            $table->foreignId('school_year_id')->constrained()->cascadeOnDelete();
            $table->timestamp('visited_at')->index();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['registered_visitor_id', 'school_year_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('library_visits');
    }
};
