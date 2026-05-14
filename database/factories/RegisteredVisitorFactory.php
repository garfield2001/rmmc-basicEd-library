<?php

namespace Database\Factories;

use App\Models\RegisteredVisitor;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<RegisteredVisitor>
 */
class RegisteredVisitorFactory extends Factory
{
    protected $model = RegisteredVisitor::class;

    public function definition(): array
    {
        return [
            'rfid_uid' => $this->uniqueRFIDUid(),
            'school_id' => fake()->unique()->bothify('ID-####'),
            'type' => RegisteredVisitor::TYPE_STUDENT,
            'first_name' => fake()->firstName(),
            'middle_name' => fake()->optional(0.35)->lastName(),
            'last_name' => fake()->lastName(),
            'photo' => null,
        ];
    }

    public function student(): static
    {
        return $this->state(fn (): array => [
            'type' => RegisteredVisitor::TYPE_STUDENT,
            'school_id' => $this->uniqueStudentSchoolId(),
        ]);
    }

    public function employee(): static
    {
        return $this->state(fn (): array => [
            'type' => RegisteredVisitor::TYPE_EMPLOYEE,
            'school_id' => fake()->unique()->numerify('FAKE-EMP-#####'),
        ]);
    }

    private function uniqueRFIDUid(): string
    {
        do {
            $RFIDUid = (string) random_int(1000000000, 9999999999);
        } while (RegisteredVisitor::query()->where('rfid_uid', $RFIDUid)->exists());

        return $RFIDUid;
    }

    private function uniqueStudentSchoolId(): string
    {
        $yearPrefixes = ['19', '20', '21', '22', '23', '24', '25', '26'];

        do {
            $schoolId = fake()->randomElement($yearPrefixes).str_pad((string) random_int(0, 99999999), 8, '0', STR_PAD_LEFT);
        } while (RegisteredVisitor::query()->where('school_id', $schoolId)->exists());

        return $schoolId;
    }
}
