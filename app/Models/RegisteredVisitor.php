<?php

namespace App\Models;

use App\Support\Names\PersonName;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class RegisteredVisitor extends Model
{
    use HasFactory;

    public const TYPE_STUDENT = 'student';

    public const TYPE_EMPLOYEE = 'employee';

    protected $fillable = [
        'rfid_uid',
        'school_id',
        'type',
        'first_name',
        'middle_name',
        'last_name',
        'photo',
    ];

    protected $appends = [
        'full_name',
    ];

    public function visits(): HasMany
    {
        return $this->hasMany(LibraryVisit::class);
    }

    public function student(): HasOne
    {
        return $this->hasOne(StudentRegistration::class)->latestOfMany('school_year_id');
    }

    public function studentRegistrations(): HasMany
    {
        return $this->hasMany(StudentRegistration::class);
    }

    public function employee(): HasOne
    {
        return $this->hasOne(EmployeeProfile::class);
    }

    public function employeeProfiles(): HasMany
    {
        return $this->hasMany(EmployeeProfile::class);
    }

    public function scopeVisitEligibleForSchoolYear(Builder $query, ?int $schoolYearId): Builder
    {
        if (! $schoolYearId) {
            return $query->whereRaw('1 = 0');
        }

        return $query->where(function (Builder $query) use ($schoolYearId): void {
            $query
                ->where(function (Builder $query) use ($schoolYearId): void {
                    $query
                        ->where('type', self::TYPE_EMPLOYEE)
                        ->whereHas('employeeProfiles', fn (Builder $query) => $query->forSchoolYear($schoolYearId));
                })
                ->orWhere(function (Builder $query) use ($schoolYearId): void {
                    $query
                        ->where('type', self::TYPE_STUDENT)
                        ->whereHas('studentRegistrations', fn (Builder $query) => $query->forSchoolYear($schoolYearId));
                });
        });
    }

    public function scopeOfType(Builder $query, ?string $type): Builder
    {
        if (! in_array($type, [self::TYPE_STUDENT, self::TYPE_EMPLOYEE], true)) {
            return $query;
        }

        return $query->where('type', $type);
    }

    public function scopeSearch(Builder $query, ?string $search): Builder
    {
        if (! $search) {
            return $query;
        }

        return $query->where(function (Builder $query) use ($search): void {
            $query
                ->where('school_id', 'like', "%{$search}%")
                ->orWhere('rfid_uid', 'like', "%{$search}%")
                ->orWhere('first_name', 'like', "%{$search}%")
                ->orWhere('last_name', 'like', "%{$search}%");
        });
    }

    protected function fullName(): Attribute
    {
        return Attribute::get(function (): string {
            $middleInitial = $this->middle_name
                ? strtoupper(substr(trim($this->middle_name), 0, 1)).'.'
                : null;

            return trim(collect([
                PersonName::part($this->first_name),
                $middleInitial,
                PersonName::part($this->last_name),
            ])->filter()->implode(' '));
        });
    }

    protected function group(): Attribute
    {
        return Attribute::get(function (): ?string {
            if ($this->type === self::TYPE_STUDENT) {
                return trim(collect([$this->student?->year_level, $this->student?->section])->filter()->implode(' - ')) ?: null;
            }

            return $this->employee?->department;
        });
    }
}
