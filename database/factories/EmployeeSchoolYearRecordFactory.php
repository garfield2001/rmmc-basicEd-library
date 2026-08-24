<?php

namespace Database\Factories;

use App\Models\EmployeeSchoolYearRecord;
use App\Models\LibraryMember;
use App\Models\SchoolYear;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Employee>
 */
class EmployeeSchoolYearRecordFactory extends Factory
{
    protected $model = EmployeeSchoolYearRecord::class;

    public function definition(): array
    {
        return [
            'library_member_id' => LibraryMember::factory()->employee(),
            'school_year_id' => SchoolYear::query()->active()->value('id') ?? SchoolYear::factory()->active()->create()->id,
            'department' => fake()->randomElement([
                'Elementary',
                'High School',
                'Office Personnel',
            ]),
        ];
    }
}
