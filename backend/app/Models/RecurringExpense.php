<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RecurringExpense extends Model
{
    protected $fillable = [
        'amount_cents',
        'category_id',
        'family_member_id',
        'created_by_user_id',
        'description',
        'frequency',
        'day_of_month',
        'day_of_week',
        'month_of_year',
        'starts_on',
        'ends_on',
        'last_generated_on',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'starts_on' => 'date',
            'ends_on' => 'date',
            'last_generated_on' => 'date',
            'is_active' => 'boolean',
            'amount_cents' => 'integer',
            'day_of_month' => 'integer',
            'day_of_week' => 'integer',
            'month_of_year' => 'integer',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function familyMember(): BelongsTo
    {
        return $this->belongsTo(FamilyMember::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function generatedExpenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }
}
