<?php

namespace Database\Seeders;

use App\Models\FamilyMember;
use Illuminate\Database\Seeder;

class FamilyMemberSeeder extends Seeder
{
    public function run(): void
    {
        $members = [
            ['name' => 'Papá',    'color' => '#3B82F6', 'icon' => 'user',  'display_order' => 1],
            ['name' => 'Mamá',    'color' => '#F472B6', 'icon' => 'user',  'display_order' => 2],
            ['name' => 'Claudia', 'color' => '#A855F7', 'icon' => 'user',  'display_order' => 3],
            ['name' => 'Pablo',   'color' => '#F97316', 'icon' => 'user',  'display_order' => 4],
            ['name' => 'Familia', 'color' => '#34D399', 'icon' => 'users', 'display_order' => 5],
        ];

        foreach ($members as $member) {
            FamilyMember::updateOrCreate(['name' => $member['name']], $member);
        }
    }
}
