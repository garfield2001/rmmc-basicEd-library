<?php

namespace Database\Factories;

use App\Models\SchoolYear;
use App\Models\SchoolYearSection;
use App\Support\Academics\AcademicLevels;
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
            'year_level' => fake()->randomElement(AcademicLevels::options()),
            'name' => fake()->randomElement(['Aguinaldo', 'Bonifacio', 'Del Pilar', 'Jacinto']),
        ];
    }
}
