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
                'Integration School Faculty',
                'Senior High School Faculty',
                'College of Engineering Faculty',
                'College of Medical Technology Faculty',
                'College of Nursing Faculty',
                'College of Information Technology Faculty',
                'College of Computer Science Faculty',
                'College of Teacher Education Faculty',
                'College of Business Administration Faculty',
                'College of Hospitality Management Faculty',
                'Mathematics Faculty',
                'Science Faculty',
            ]),
        ];
    }
}
