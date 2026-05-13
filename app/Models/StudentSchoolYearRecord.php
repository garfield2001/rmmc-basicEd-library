<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class StudentSchoolYearRecord extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'registered_visitor_id',
        'school_year_id',
        'school_year_section_id',
        'year_level',
        'section',
    ];

    public function member(): BelongsTo
    {
        return $this->belongsTo(RegisteredVisitor::class, 'registered_visitor_id')->withTrashed();
    }

    public function schoolYear(): BelongsTo
    {
        return $this->belongsTo(SchoolYear::class)->withTrashed();
    }

    public function schoolYearSection(): BelongsTo
    {
        return $this->belongsTo(SchoolYearSection::class);
    }

    public function scopeForSchoolYear(Builder $query, ?int $schoolYearId): Builder
    {
        if (! $schoolYearId) {
            return $query;
        }

        return $query->where('school_year_id', $schoolYearId);
    }
}
