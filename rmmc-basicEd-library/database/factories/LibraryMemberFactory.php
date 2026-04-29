<?php

namespace Database\Factories;

use App\Models\LibraryMember;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LibraryMember>
 */
class LibraryMemberFactory extends Factory
{
    protected $model = LibraryMember::class;

    public function definition(): array
    {
        return [
            'rfid_uid' => fake()->unique()->numerify('######'),
            'school_id' => fake()->unique()->bothify('ID-####'),
            'type' => LibraryMember::TYPE_STUDENT,
            'first_name' => fake()->firstName(),
            'middle_name' => fake()->optional(0.35)->lastName(),
            'last_name' => fake()->lastName(),
            'photo' => null,
            'is_active' => true,
        ];
    }

    public function student(): static
    {
        return $this->state(fn (): array => [
            'type' => LibraryMember::TYPE_STUDENT,
            'school_id' => fake()->unique()->numerify('STU-####'),
        ]);
    }

    public function employee(): static
    {
        return $this->state(fn (): array => [
            'type' => LibraryMember::TYPE_EMPLOYEE,
            'school_id' => fake()->unique()->numerify('EMP-####'),
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn (): array => [
            'is_active' => false,
        ]);
    }
}
