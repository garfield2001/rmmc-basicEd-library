<?php

namespace Database\Factories;

use App\Models\RegisteredVisitor;
use App\Models\LibraryVisit;
use App\Models\SchoolYear;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LibraryVisit>
 */
class LibraryVisitFactory extends Factory
{
    protected $model = LibraryVisit::class;

    public function definition(): array
    {
        return [
            'registered_visitor_id' => RegisteredVisitor::factory(),
            'school_year_id' => SchoolYear::factory(),
            'visited_at' => fake()->dateTimeBetween('-30 days', 'now'),
        ];
    }
}
