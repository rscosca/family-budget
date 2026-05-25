<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['username' => 'papa'],
            [
                'name'            => 'Papá',
                'email'           => 'papa@family.local',
                'password'        => Hash::make('P1234_apa'),
                'role'            => 'admin',
                'avatar_initials' => 'PA',
            ],
        );

        User::updateOrCreate(
            ['username' => 'mama'],
            [
                'name'            => 'Mamá',
                'email'           => 'mama@family.local',
                'password'        => Hash::make('M1234_ama'),
                'role'            => 'collaborator',
                'avatar_initials' => 'MA',
            ],
        );

        $this->command->info('  ┌──────┬───────────┐');
        $this->command->info('  │ user │ password  │');
        $this->command->info('  ├──────┼───────────┤');
        $this->command->info('  │ papa │ P1234_apa │');
        $this->command->info('  │ mama │ M1234_ama │');
        $this->command->info('  └──────┴───────────┘');
    }
}
