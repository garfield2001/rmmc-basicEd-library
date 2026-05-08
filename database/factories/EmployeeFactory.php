<?php

namespace Database\Factories;

use App\Models\Employee;
use App\Models\LibraryMember;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Employee>
 */
class EmployeeFactory extends Factory
{
    protected $model = Employee::class;

    public function definition(): array
    {
        return [
            'library_member_id' => LibraryMember::factory()->employee(),
            'department' => fake()->randomElement([
                'Basic Education Faculty',
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
