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
            'department' => fake()->randomElement(['Faculty', 'Library', 'Registrar', 'Guidance', 'Administration']),
        ];
    }
}
