<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::query()->updateOrCreate(
            ['email' => 'admin@gmail.com'],
            [
                'name' => 'RMMC Library Admin',
                'password' => 'password',
                'role' => 'admin',
            ],
        );

        $this->command?->info('Admin login: admin@gmail.com / password');
    }
}
