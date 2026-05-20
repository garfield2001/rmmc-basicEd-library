<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LibraryVisit extends Model
{
    use HasFactory;

    protected $fillable = [
        'library_member_id',
        'school_year_id',
        'visited_at',
    ];

    protected function casts(): array
    {
        return [
            'visited_at' => 'datetime',
        ];
    }

    public function visitor(): BelongsTo
    {
        return $this->belongsTo(LibraryMember::class, 'library_member_id');
    }

    public function schoolYear(): BelongsTo
    {
        return $this->belongsTo(SchoolYear::class);
    }

    public function scopeForRequiredSchoolYear(Builder $query, ?int $schoolYearId): Builder
    {
        return $schoolYearId
            ? $query->where('school_year_id', $schoolYearId)
            : $query->whereKey([]);
    }
}
