<?php

namespace Database\Factories;

use App\Models\LibraryMember;
use App\Models\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Student>
 */
class StudentFactory extends Factory
{
    protected $model = Student::class;

    public function definition(): array
    {
        return [
            'library_member_id' => LibraryMember::factory()->student(),
            'year_level' => fake()->randomElement(['Kinder', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10']),
            'section' => fake()->randomElement(['Aguinaldo', 'Bonifacio', 'Del Pilar', 'Jacinto', 'Mabini', 'Rizal']),
        ];
    }
}
