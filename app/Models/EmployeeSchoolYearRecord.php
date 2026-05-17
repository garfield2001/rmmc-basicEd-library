<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeSchoolYearRecord extends Model
{
    use HasFactory;

    protected static function booted(): void
    {
        static::creating(function (EmployeeSchoolYearRecord $profile): void {
            if (! $profile->school_year_id) {
                $profile->school_year_id = SchoolYear::active()->value('id');
            }

            $visitor = $profile->visitor ?: LibraryMember::query()->find($profile->library_member_id);

            if (! $visitor) {
                return;
            }

            $profile->school_id ??= $visitor->school_id;
            $profile->rfid_uid ??= $visitor->rfid_uid;
            $profile->first_name ??= $visitor->first_name;
            $profile->middle_name ??= $visitor->middle_name;
            $profile->last_name ??= $visitor->last_name;
            $profile->photo ??= $visitor->photo;
        });
    }

    protected $fillable = [
        'library_member_id',
        'school_year_id',
        'school_id',
        'rfid_uid',
        'first_name',
        'middle_name',
        'last_name',
        'photo',
        'department',
    ];

    public function visitor(): BelongsTo
    {
        return $this->belongsTo(LibraryMember::class, 'library_member_id');
    }

    public function schoolYear(): BelongsTo
    {
        return $this->belongsTo(SchoolYear::class);
    }

    public function scopeForSchoolYear(Builder $query, ?int $schoolYearId): Builder
    {
        if (! $schoolYearId) {
            return $query;
        }

        return $query->where('school_year_id', $schoolYearId);
    }
}
