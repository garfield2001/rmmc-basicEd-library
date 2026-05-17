<?php

namespace Database\Factories;

use App\Models\LibraryMember;
use App\Models\SchoolYear;
use App\Models\SchoolYearSection;
use App\Models\StudentSchoolYearRecord;
use App\Support\Academics\AcademicLevels;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StudentSchoolYearRecord>
 */
class StudentSchoolYearRecordFactory extends Factory
{
    protected $model = StudentSchoolYearRecord::class;

    public function definition(): array
    {
        $schoolYearId = SchoolYear::query()->active()->value('id') ?? SchoolYear::factory()->active()->create()->id;
        $yearLevel = fake()->randomElement(AcademicLevels::options());
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
        ];
    }
}
