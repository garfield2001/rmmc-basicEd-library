<?php

namespace Database\Factories;

use App\Models\SchoolYear;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SchoolYear>
 */
class SchoolYearFactory extends Factory
{
    protected $model = SchoolYear::class;

    public function definition(): array
    {
        $year = fake()->numberBetween(2024, 2028);

        return [
            'name' => $year.'-'.($year + 1),
            'starts_at' => "{$year}-06-01",
            'ends_at' => ($year + 1).'-03-31',
            'minimum_visits' => 3,
            'target_visits' => 4,
            'is_active' => false,
        ];
    }

    public function active(): static
    {
        return $this->state(fn (): array => [
            'is_active' => true,
        ]);
    }
}
