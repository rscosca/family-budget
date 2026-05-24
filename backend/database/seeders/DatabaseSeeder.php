<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            FamilyMemberSeeder::class,
            CategorySeeder::class,
            RecurringExpenseSeeder::class,
            ExpenseSeeder::class,
        ]);
    }
}
