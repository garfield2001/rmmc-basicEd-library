<?php

namespace App\Services\Dashboard;

class AdminVisitRelations
{
    public static function student(?int $schoolYearId): \Closure
    {
        return fn ($query) => $query
            ->select(
                'student_school_year_records.id',
                'student_school_year_records.library_member_id',
                'student_school_year_records.school_year_id',
                'student_school_year_records.year_level',
                'student_school_year_records.section',
            )
            ->forSchoolYear($schoolYearId);
    }

    public static function employee(?int $schoolYearId): \Closure
    {
        return fn ($query) => $query
            ->select('id', 'library_member_id', 'school_year_id', 'department')
            ->forSchoolYear($schoolYearId);
    }
}
