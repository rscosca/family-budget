<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\FamilyMember;
use App\Models\RecurringExpense;
use App\Models\User;
use Illuminate\Database\Seeder;

class RecurringExpenseSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('role', 'admin')->firstOrFail();

        $categories = Category::pluck('id', 'name');
        $members = FamilyMember::pluck('id', 'name');

        $items = [
            [
                'description'  => 'Hipoteca',
                'amount_cents' => 85000,
                'category'     => 'Casa',
                'member'       => 'Familia',
                'frequency'    => 'monthly',
                'day_of_month' => 1,
            ],
            [
                'description'  => 'Luz',
                'amount_cents' => 6500,
                'category'     => 'Casa',
                'member'       => 'Familia',
                'frequency'    => 'monthly',
                'day_of_month' => 5,
            ],
            [
                'description'  => 'Internet + fibra',
                'amount_cents' => 4500,
                'category'     => 'Casa',
                'member'       => 'Familia',
                'frequency'    => 'monthly',
                'day_of_month' => 10,
            ],
            [
                'description'  => 'Gas',
                'amount_cents' => 4000,
                'category'     => 'Casa',
                'member'       => 'Familia',
                'frequency'    => 'monthly',
                'day_of_month' => 15,
            ],
            [
                'description'  => 'Netflix',
                'amount_cents' => 1599,
                'category'     => 'Ocio',
                'member'       => 'Familia',
                'frequency'    => 'monthly',
                'day_of_month' => 8,
            ],
            [
                'description'  => 'Spotify Familiar',
                'amount_cents' => 1799,
                'category'     => 'Ocio',
                'member'       => 'Familia',
                'frequency'    => 'monthly',
                'day_of_month' => 12,
            ],
            [
                'description'  => 'Gimnasio Papá',
                'amount_cents' => 3500,
                'category'     => 'Ocio',
                'member'       => 'Papá',
                'frequency'    => 'monthly',
                'day_of_month' => 1,
            ],
            [
                'description'   => 'Seguro hogar',
                'amount_cents'  => 28500,
                'category'      => 'Casa',
                'member'        => 'Familia',
                'frequency'     => 'yearly',
                'month_of_year' => 3,
                'day_of_month'  => 15,
            ],
        ];

        foreach ($items as $item) {
            RecurringExpense::updateOrCreate(
                ['description' => $item['description']],
                [
                    'amount_cents'        => $item['amount_cents'],
                    'category_id'         => $categories[$item['category']],
                    'family_member_id'    => $members[$item['member']],
                    'created_by_user_id'  => $admin->id,
                    'frequency'           => $item['frequency'],
                    'day_of_month'        => $item['day_of_month'] ?? null,
                    'day_of_week'         => $item['day_of_week'] ?? null,
                    'month_of_year'       => $item['month_of_year'] ?? null,
                    'starts_on'           => '2025-01-01',
                    'ends_on'             => null,
                    'last_generated_on'   => null,
                    'is_active'           => true,
                ],
            );
        }
    }
}
