<?php

namespace Database\Factories;

use App\Models\LibraryMember;
use App\Models\SchoolYear;
use App\Models\SchoolYearSection;
use App\Models\StudentEnrollment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StudentEnrollment>
 */
class StudentEnrollmentFactory extends Factory
{
    protected $model = StudentEnrollment::class;

    public function definition(): array
    {
        $schoolYearId = SchoolYear::query()->active()->value('id') ?? SchoolYear::factory()->active()->create()->id;
        $yearLevel = fake()->randomElement([
            'Kindergarten',
            'Grade 1',
            'Grade 2',
            'Grade 3',
            'Grade 4',
            'Grade 5',
            'Grade 6',
            'Grade 7',
            'Grade 8',
            'Grade 9',
            'Grade 10',
        ]);
        $sectionName = fake()->randomElement(['Aguinaldo', 'Bonifacio', 'Del Pilar', 'Jacinto', 'Mabini', 'Rizal']);

        return [
            'library_member_id' => LibraryMember::factory()->student(),
            'school_year_id' => $schoolYearId,
            'school_year_section_id' => SchoolYearSection::query()->firstOrCreate([
                'school_year_id' => $schoolYearId,
                'year_level' => $yearLevel,
                'name' => $sectionName,
            ])->id,
            'year_level' => $yearLevel,
            'section' => $sectionName,
            'status' => 'enrolled',
        ];
    }
}
