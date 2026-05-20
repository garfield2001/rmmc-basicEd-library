<?php

namespace App\Services\Dashboard;

use App\Models\LibraryMember;
use App\Models\SchoolYear;
use Illuminate\Database\Eloquent\Builder;

class AdminScanTargetSearchService
{
    public function __construct(private readonly AdminVisitPayloadService $payloads) {}

    public function search(string $search, int $limit = 8): array
    {
        $search = trim($search);

        if ($search === '') {
            return [];
        }

        $schoolYearId = SchoolYear::active()->value('id');

        return LibraryMember::query()
            ->visitEligibleForSchoolYear($schoolYearId)
            ->with([
                'student' => AdminVisitRelations::student($schoolYearId),
                'employee' => AdminVisitRelations::employee($schoolYearId),
            ])
            ->where(fn (Builder $query) => $this->applySearch($query, $schoolYearId, $search))
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->limit($limit)
            ->get()
            ->map(fn (LibraryMember $visitor): array => $this->payloads->scanTargetData($visitor))
            ->all();
    }

    private function applySearch(Builder $query, ?int $schoolYearId, string $search): void
    {
        $query
            ->where('school_id', 'like', "{$search}%")
            ->orWhere('rfid_uid', 'like', "{$search}%")
            ->orWhere('first_name', 'like', "%{$search}%")
            ->orWhere('last_name', 'like', "%{$search}%")
            ->orWhereHas('studentSchoolYearRecords', function (Builder $query) use ($schoolYearId, $search): void {
                $query
                    ->forSchoolYear($schoolYearId)
                    ->where(function (Builder $query) use ($search): void {
                        $query
                            ->where('year_level', 'like', "%{$search}%")
                            ->orWhere('section', 'like', "%{$search}%");
                    });
            })
            ->orWhereHas('employeeSchoolYearRecords', fn (Builder $query) => $query
                ->forSchoolYear($schoolYearId)
                ->where('department', 'like', "%{$search}%"));
    }
}
