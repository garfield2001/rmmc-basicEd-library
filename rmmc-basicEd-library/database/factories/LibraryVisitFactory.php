<?php

namespace Database\Factories;

use App\Models\LibraryMember;
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
            'library_member_id' => LibraryMember::factory(),
            'school_year_id' => SchoolYear::factory(),
            'visited_at' => fake()->dateTimeBetween('-30 days', 'now'),
        ];
    }
}
