<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('amount_cents');
            $table->foreignId('category_id')->constrained('categories')->restrictOnDelete();
            $table->foreignId('family_member_id')->constrained('family_members')->restrictOnDelete();
            $table->foreignId('registered_by_user_id')->constrained('users')->restrictOnDelete();
            $table->string('description', 160)->nullable();
            $table->date('occurred_on');
            $table->foreignId('recurring_expense_id')
                ->nullable()
                ->constrained('recurring_expenses')
                ->nullOnDelete();
            $table->timestamps();

            $table->index('occurred_on');
            $table->index(['category_id', 'occurred_on']);
            $table->index(['family_member_id', 'occurred_on']);
            $table->index('registered_by_user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
