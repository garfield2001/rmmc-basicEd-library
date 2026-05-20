<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

class SchoolYear extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'starts_at',
        'ends_at',
        'student_required_visits',
        'employee_required_visits',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'date',
            'ends_at' => 'date',
            'student_required_visits' => 'integer',
            'employee_required_visits' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function visits(): HasMany
    {
        return $this->hasMany(LibraryVisit::class);
    }

    public function studentSchoolYearRecords(): HasMany
    {
        return $this->hasMany(StudentSchoolYearRecord::class);
    }

    public function employeeSchoolYearRecords(): HasMany
    {
        return $this->hasMany(EmployeeSchoolYearRecord::class);
    }

    public function sections(): HasMany
    {
        return $this->hasMany(SchoolYearSection::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function startDate(): Carbon
    {
        return Carbon::parse($this->starts_at);
    }

    public function endDate(): Carbon
    {
        return Carbon::parse($this->ends_at);
    }

    public function startDateString(): string
    {
        return $this->startDate()->toDateString();
    }

    public function endDateString(): string
    {
        return $this->endDate()->toDateString();
    }
}
