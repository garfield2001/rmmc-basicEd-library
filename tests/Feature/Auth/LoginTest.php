<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_route_opens_public_login_modal(): void
    {
        $this->get('/login')->assertRedirect('/?login=1');
    }

    public function test_user_can_log_in_with_email_and_password(): void
    {
        $user = User::factory()->create([
            'email' => 'librarian@example.com',
            'password' => 'password',
            'role' => 'admin',
        ]);

        $response = $this->post('/login', [
            'email' => 'librarian@example.com',
            'password' => 'password',
        ]);

        $this->assertAuthenticatedAs($user);
        $response->assertRedirect('/admin');
        $this->get('/admin')->assertOk();
    }

    public function test_user_can_not_log_in_with_invalid_password(): void
    {
        User::factory()->create([
            'email' => 'librarian@example.com',
            'password' => 'password',
        ]);

        $this->post('/login', [
            'email' => 'librarian@example.com',
            'password' => 'wrong-password',
        ]);

        $this->assertGuest();
    }

    public function test_user_can_log_out(): void
    {
        $user = User::factory()->create([
            'role' => 'admin',
        ]);

        $response = $this->actingAs($user)->post('/logout');

        $this->assertGuest();
        $response->assertRedirect('/');
    }
}
