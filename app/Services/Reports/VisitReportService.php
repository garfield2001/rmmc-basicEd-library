<?php

namespace App\Services\Reports;

use App\Models\LibraryVisit;
use Illuminate\Support\Carbon;

class VisitReportService
{
    public function getData(array $filters = []): array
    {
        $startDate = isset($filters['start_date']) ? Carbon::parse($filters['start_date'])->startOfDay() : now()->startOfMonth();
        $endDate = isset($filters['end_date']) ? Carbon::parse($filters['end_date'])->endOfDay() : now()->endOfDay();
        $memberType = $filters['member_type'] ?? null;

        $query = LibraryVisit::query()
            ->with(['member.student', 'member.employee', 'schoolYear'])
            ->whereBetween('visited_at', [$startDate, $endDate])
            ->when($memberType, fn ($query) => $query->whereHas('member', fn ($memberQuery) => $memberQuery->where('type', $memberType)))
            ->latest('visited_at');

        $visits = $query->get();

        return [
            'filters' => [
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'member_type' => $memberType,
            ],
            'summary' => [
                'total' => $visits->count(),
                'students' => $visits->where('member.type', 'student')->count(),
                'employees' => $visits->where('member.type', 'employee')->count(),
            ],
            'rows' => $visits->map(fn (LibraryVisit $visit): array => [
                'id' => $visit->id,
                'visited_at' => $visit->visited_at?->format('Y-m-d H:i:s'),
                'school_year' => $visit->schoolYear?->name,
                'school_id' => $visit->member?->school_id,
                'name' => $visit->member?->full_name,
                'type' => $visit->member?->type,
                'department' => $visit->member?->employee?->department,
                'year_level' => $visit->member?->student?->year_level,
                'section' => $visit->member?->student?->section,
            ])->values(),
        ];
    }
}
