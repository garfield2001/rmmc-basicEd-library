<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class SchoolYearSection extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'school_year_id',
        'year_level',
        'name',
    ];

    public function schoolYear(): BelongsTo
    {
        return $this->belongsTo(SchoolYear::class)->withTrashed();
    }

    public function studentSchoolYearRecords(): HasMany
    {
        return $this->hasMany(StudentSchoolYearRecord::class);
    }

    public function scopeForSchoolYear(Builder $query, ?int $schoolYearId): Builder
    {
        if (! $schoolYearId) {
            return $query;
        }

        return $query->where('school_year_id', $schoolYearId);
    }
}
