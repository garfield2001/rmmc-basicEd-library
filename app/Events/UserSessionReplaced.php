<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserSessionReplaced implements ShouldBroadcastNow
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public User $user,
        public string $sessionId,
    ) {}

    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel("App.Models.User.{$this->user->id}");
    }

    public function broadcastAs(): string
    {
        return 'UserSessionReplaced';
    }

    /**
     * @return array{sessionId: string}
     */
    public function broadcastWith(): array
    {
        return [
            'sessionId' => $this->sessionId,
        ];
    }
}
