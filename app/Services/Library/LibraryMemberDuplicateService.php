<?php

namespace App\Services\Library;

use App\Models\LibraryMember;
use App\Models\LibraryVisit;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class LibraryMemberDuplicateService
{
    public function __construct(private readonly LibraryMemberDuplicateCriteria $criteria) {}

    public function applyCanonicalFilter(Builder $query, string $type, ?int $schoolYearId): void
    {
        if (! $schoolYearId) {
            return;
        }

        $query->where(function (Builder $query) use ($type, $schoolYearId): void {
            $query
                ->where(fn (Builder $query) => $this->criteria->whereHasIdentifier($query, 'library_members'))
                ->orWhereNotExists(fn ($query) => $this->duplicateVisitorExists($query, $type, $schoolYearId));
        });
    }

    /**
     * @return Collection<int, LibraryMember>
     */
    public function unresolvedCandidatesFor(LibraryMember $visitor, ?int $schoolYearId): Collection
    {
        if (! $schoolYearId) {
            return collect();
        }

        return LibraryMember::query()
            ->whereKeyNot($visitor->id)
            ->where('type', $visitor->type)
            ->where('first_name', $visitor->first_name)
            ->where('last_name', $visitor->last_name)
            ->where(fn (Builder $query) => $this->criteria->whereMissingIdentifier($query, 'library_members'))
            ->tap(fn (Builder $query) => $this->criteria->whereSameOptionalValue($query, 'middle_name', $visitor->middle_name))
            ->when(
                $visitor->type === LibraryMember::TYPE_STUDENT,
                fn (Builder $query) => $this->criteria->whereSameStudentGroupAsVisitor($query, $visitor, $schoolYearId),
                fn (Builder $query) => $this->criteria->whereSameEmployeeGroupAsVisitor($query, $visitor, $schoolYearId),
            )
            ->orderBy('id')
            ->get();
    }

    public function mergeInto(LibraryMember $keeper, Collection $duplicates): int
    {
        $merged = 0;

        DB::transaction(function () use ($keeper, $duplicates, &$merged): void {
            foreach ($duplicates as $duplicate) {
                if (! $duplicate instanceof LibraryMember || $duplicate->is($keeper)) {
                    continue;
                }

                LibraryVisit::query()
                    ->where('library_member_id', $duplicate->id)
                    ->update(['library_member_id' => $keeper->id]);

                $duplicate->delete();
                $merged++;
            }
        });

        return $merged;
    }

    private function duplicateVisitorExists(mixed $query, string $type, int $schoolYearId): void
    {
        $query
            ->select('duplicate_visitors.id')
            ->from('library_members as duplicate_visitors')
            ->whereColumn('duplicate_visitors.type', 'library_members.type')
            ->whereColumn('duplicate_visitors.first_name', 'library_members.first_name')
            ->whereColumn('duplicate_visitors.last_name', 'library_members.last_name')
            ->tap(fn ($query) => $this->criteria->whereSameOptionalColumn($query, 'duplicate_visitors.middle_name', 'library_members.middle_name'))
            ->whereColumn('duplicate_visitors.id', '!=', 'library_members.id')
            ->where(function ($query): void {
                $query
                    ->where(fn ($query) => $this->criteria->whereHasIdentifier($query, 'duplicate_visitors'))
                    ->orWhereColumn('duplicate_visitors.id', '<', 'library_members.id');
            })
            ->when(
                $type === LibraryMember::TYPE_STUDENT,
                fn ($query) => $this->criteria->whereSameActiveStudentGroup($query, $schoolYearId),
                fn ($query) => $this->criteria->whereSameActiveEmployeeGroup($query, $schoolYearId),
            );
    }
}
