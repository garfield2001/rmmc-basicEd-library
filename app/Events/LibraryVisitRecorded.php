<?php

namespace App\Events;

use App\Models\LibraryVisit;
use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LibraryVisitRecorded implements ShouldBroadcast
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
            'visitor.student' => fn ($query) => $query->forSchoolYear($visit->school_year_id),
            'visitor.employee' => fn ($query) => $query->forSchoolYear($visit->school_year_id),
        ]);

        $this->visit = [
            'id' => $visit->id,
            'visitedAt' => $visit->visited_at?->toIso8601String(),
            'visitor' => [
                'schoolId' => $visit->visitor?->school_id,
                'name' => $visit->visitor?->full_name,
                'type' => $visit->visitor?->type,
                'yearLevel' => $visit->visitor?->student?->year_level,
                'section' => $visit->visitor?->student?->section,
                'department' => $visit->visitor?->employee?->department,
                'photoUrl' => $visit->visitor?->photo ? asset('visitor-photos/'.$visit->visitor->photo) : null,
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
