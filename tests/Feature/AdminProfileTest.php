<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_update_profile(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'name' => 'Old Name',
            'email' => 'old@example.com',
        ]);

        $this->actingAs($admin)
            ->patch('/admin/profile', [
                'name' => 'Library Staff',
                'email' => 'staff@example.com',
            ])
            ->assertSessionHasNoErrors()
            ->assertSessionHas('success', 'Admin settings updated.');

        $admin->refresh();

        $this->assertSame('Library Staff', $admin->name);
        $this->assertSame('staff@example.com', $admin->email);
    }

    public function test_admin_can_update_password_with_current_password(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'password' => 'old-password',
        ]);

        $this->actingAs($admin)
            ->patch('/admin/profile', [
                'name' => $admin->name,
                'email' => $admin->email,
                'current_password' => 'old-password',
                'password' => 'new-secure-password',
                'password_confirmation' => 'new-secure-password',
            ])
            ->assertSessionHasNoErrors();

        $this->assertTrue(Hash::check('new-secure-password', $admin->refresh()->password));
    }

    public function test_password_change_requires_current_password(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'password' => 'old-password',
        ]);

        $this->actingAs($admin)
            ->patch('/admin/profile', [
                'name' => $admin->name,
                'email' => $admin->email,
                'password' => 'new-secure-password',
                'password_confirmation' => 'new-secure-password',
            ])
            ->assertSessionHasErrors('current_password');

        $this->assertTrue(Hash::check('old-password', $admin->refresh()->password));
    }
}
