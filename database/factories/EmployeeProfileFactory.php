<?php

namespace Database\Factories;

use App\Models\EmployeeProfile;
use App\Models\RegisteredVisitor;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Employee>
 */
class EmployeeProfileFactory extends Factory
{
    protected $model = EmployeeProfile::class;

    public function definition(): array
    {
        return [
            'registered_visitor_id' => RegisteredVisitor::factory()->employee(),
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
