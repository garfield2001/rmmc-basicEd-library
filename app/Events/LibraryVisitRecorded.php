<?php

namespace App\Events;

use App\Models\LibraryVisit;
use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LibraryVisitRecorded implements ShouldBroadcastNow
{
    use Dispatchable;
    use SerializesModels;

    /**
     * @var array<string, mixed>
     */
    public array $visit;

    public function __construct(LibraryVisit $visit)
    {
        $visit->loadMissing([
            'member.student' => fn ($query) => $query->forSchoolYear($visit->school_year_id),
            'member.employee',
        ]);

        $this->visit = [
            'id' => $visit->id,
            'visitedAt' => $visit->visited_at?->toIso8601String(),
            'member' => [
                'schoolId' => $visit->member?->school_id,
                'name' => $visit->member?->full_name,
                'type' => $visit->member?->type,
                'yearLevel' => $visit->member?->student?->year_level,
                'section' => $visit->member?->student?->section,
                'department' => $visit->member?->employee?->department,
                'photoUrl' => $visit->member?->photo ? asset('member-photos/'.$visit->member->photo) : null,
            ],
        ];
    }

    public function broadcastOn(): Channel
    {
        return new Channel('library-visits');
    }

    public function broadcastAs(): string
    {
        return 'LibraryVisitRecorded';
    }
}
