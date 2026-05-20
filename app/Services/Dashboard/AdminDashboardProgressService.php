<?php

namespace App\Services\Dashboard;

use App\Models\LibraryMember;
use App\Models\SchoolYear;
use Illuminate\Support\Collection;

class AdminDashboardProgressService
{
    public function requiredProgress(?SchoolYear $schoolYear): array
    {
        if (! $schoolYear) {
            return [];
        }

        return [
            $this->progressForType($schoolYear, LibraryMember::TYPE_STUDENT, 'Students', $schoolYear->student_required_visits),
            $this->progressForType($schoolYear, LibraryMember::TYPE_EMPLOYEE, 'Employees', $schoolYear->employee_required_visits),
        ];
    }

    private function progressForType(SchoolYear $schoolYear, string $type, string $label, int $requiredVisits): array
    {
        /** @var Collection<int, LibraryMember> $visitors */
        $visitors = LibraryMember::query()
            ->where('type', $type)
            ->visitEligibleForSchoolYear($schoolYear->id)
            ->withCount([
                'visits as visits_count' => fn ($query) => $query->where('school_year_id', $schoolYear->id),
            ])
            ->get();

        $visitorCount = $visitors->count();
        $visitCount = $visitors->sum('visits_count');
        $requiredTotal = $visitorCount * $requiredVisits;

        return [
            'label' => $label,
            'required' => $requiredVisits,
            'visitors' => $visitorCount,
            'visits' => $visitCount,
            'required_total' => $requiredTotal,
            'met_required' => $requiredVisits > 0 ? $visitors->where('visits_count', '>=', $requiredVisits)->count() : 0,
            'percent' => $requiredTotal > 0 ? min(100, round(($visitCount / $requiredTotal) * 100)) : 0,
        ];
    }
}
