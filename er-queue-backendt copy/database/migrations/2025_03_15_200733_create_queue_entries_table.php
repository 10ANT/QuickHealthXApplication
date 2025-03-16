<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('queue_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('triage_id')->constrained()->onDelete('cascade');
            $table->integer('urgency_score');
            $table->timestamp('entry_time');
            $table->enum('status', ['WAITING', 'IN_SESSION', 'COMPLETED'])->default('WAITING');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('queue_entries');
    }
};
