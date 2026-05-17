<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentSchoolYearRecord extends Model
{
    use HasFactory;

    protected static function booted(): void
    {
        static::creating(function (StudentSchoolYearRecord $registration): void {
            $visitor = $registration->visitor ?: LibraryMember::query()->find($registration->library_member_id);

            if (! $visitor) {
                return;
            }

            $registration->school_id ??= $visitor->school_id;
            $registration->rfid_uid ??= $visitor->rfid_uid;
            $registration->first_name ??= $visitor->first_name;
            $registration->middle_name ??= $visitor->middle_name;
            $registration->last_name ??= $visitor->last_name;
            $registration->photo ??= $visitor->photo;
        });
    }

    protected $fillable = [
        'library_member_id',
        'school_year_id',
        'school_year_section_id',
        'school_id',
        'rfid_uid',
        'first_name',
        'middle_name',
        'last_name',
        'photo',
        'year_level',
        'section',
    ];

    public function visitor(): BelongsTo
    {
        return $this->belongsTo(LibraryMember::class, 'library_member_id');
    }

    public function schoolYear(): BelongsTo
    {
        return $this->belongsTo(SchoolYear::class);
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
