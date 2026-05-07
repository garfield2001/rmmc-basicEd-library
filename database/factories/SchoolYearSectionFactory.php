<?php

namespace Database\Factories;

use App\Models\SchoolYear;
use App\Models\SchoolYearSection;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SchoolYearSection>
 */
class SchoolYearSectionFactory extends Factory
{
    protected $model = SchoolYearSection::class;

    public function definition(): array
    {
        return [
            'school_year_id' => SchoolYear::factory(),
            'year_level' => fake()->randomElement(['Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4']),
            'name' => fake()->randomElement(['Aguinaldo', 'Bonifacio', 'Del Pilar', 'Jacinto']),
        ];
    }
}
