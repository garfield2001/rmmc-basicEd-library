<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('registered_visitors', function (Blueprint $table): void {
            $table->id();
            $table->string('rfid_uid', 10)->nullable()->unique();
            $table->string('school_id')->nullable()->unique();
            $table->string('type', 24)->index();
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name');
            $table->string('photo')->nullable();
            $table->timestamps();

            $table->index(['last_name', 'first_name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('registered_visitors');
    }
};
