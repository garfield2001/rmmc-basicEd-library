<?php

namespace App\Services;

use App\Models\User;

class AdminProfileService
{
    public function update(User $user, array $data): User
    {
        $user->fill([
            'name' => $data['name'],
            'email' => $data['email'],
        ]);

        if (! empty($data['password'])) {
            $user->password = $data['password'];
        }

        $user->save();

        return $user->refresh();
    }
}
