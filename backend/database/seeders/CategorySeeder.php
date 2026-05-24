<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('role', 'admin')->first();

        $categories = [
            ['name' => 'Comida',  'color' => '#F97316', 'icon' => 'utensils',    'display_order' => 1],
            ['name' => 'Casa',    'color' => '#3B82F6', 'icon' => 'house',       'display_order' => 2],
            ['name' => 'Ocio',    'color' => '#A855F7', 'icon' => 'circle-play', 'display_order' => 3],
            ['name' => 'Familia', 'color' => '#34D399', 'icon' => 'users',       'display_order' => 4],
        ];

        foreach ($categories as $category) {
            Category::updateOrCreate(
                ['name' => $category['name']],
                array_merge($category, ['created_by_user_id' => $admin?->id]),
            );
        }
    }
}
