<?php

use App\Enums\BookCopyStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('book_copies', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('book_id')->constrained()->restrictOnDelete();
            $table->string('accession_number', 80)->unique();
            $table->string('barcode', 100)->nullable()->unique();
            $table->string('status', 20)->default(BookCopyStatus::Available->value)->index();
            $table->text('condition_notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('book_copies');
    }
};
