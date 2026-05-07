<?php

namespace App\Http\Controllers;

use App\Models\LibraryMember;
use App\Models\SchoolYear;
use App\Models\StudentEnrollment;
use Inertia\Inertia;
use Inertia\Response;

class AdminSettingsController extends Controller
{
    public function __invoke(): Response
    {
        $schoolYears = SchoolYear::query()
            ->withCount('studentEnrollments')
            ->orderByDesc('starts_at')
            ->get()
            ->map(fn (SchoolYear $schoolYear): array => [
                'id' => $schoolYear->id,
                'name' => $schoolYear->name,
                'starts_at' => $schoolYear->starts_at?->toDateString(),
                'ends_at' => $schoolYear->ends_at?->toDateString(),
                'minimum_visits' => $schoolYear->minimum_visits,
                'target_visits' => $schoolYear->target_visits,
                'is_active' => $schoolYear->is_active,
                'student_enrollments_count' => $schoolYear->student_enrollments_count,
            ]);

        return Inertia::render('admin/settings', [
            'schoolYears' => $schoolYears,
            'schoolYearStats' => [
                'studentMembers' => LibraryMember::query()->where('type', LibraryMember::TYPE_STUDENT)->count(),
                'activeEnrollments' => StudentEnrollment::query()
                    ->where('school_year_id', SchoolYear::query()->active()->value('id'))
                    ->count(),
            ],
        ]);
    }
}
