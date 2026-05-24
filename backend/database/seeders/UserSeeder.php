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
                'password'        => Hash::make('9d55c25f6306bc61fcd58350e7f16b3d'),
                'role'            => 'admin',
                'avatar_initials' => 'PA',
            ],
        );

        User::updateOrCreate(
            ['username' => 'mama'],
            [
                'name'            => 'Mamá',
                'email'           => 'mama@family.local',
                'password'        => Hash::make('eff9e8c58b0b1f3211fabb4b697d2716'),
                'role'            => 'collaborator',
                'avatar_initials' => 'MA',
            ],
        );

        $this->command->info('  ┌──────┬──────────────────────────────────┐');
        $this->command->info('  │ user │ password                         │');
        $this->command->info('  ├──────┼──────────────────────────────────┤');
        $this->command->info('  │ papa │ 9d55c25f6306bc61fcd58350e7f16b3d │');
        $this->command->info('  │ mama │ eff9e8c58b0b1f3211fabb4b697d2716 │');
        $this->command->info('  └──────┴──────────────────────────────────┘');
    }
}
