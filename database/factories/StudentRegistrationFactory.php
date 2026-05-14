<?php

namespace Database\Factories;

use App\Models\RegisteredVisitor;
use App\Models\SchoolYear;
use App\Models\SchoolYearSection;
use App\Models\StudentRegistration;
use App\Support\Academics\AcademicLevels;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StudentRegistration>
 */
class StudentRegistrationFactory extends Factory
{
    protected $model = StudentRegistration::class;

    public function definition(): array
    {
        $schoolYearId = SchoolYear::query()->active()->value('id') ?? SchoolYear::factory()->active()->create()->id;
        $yearLevel = fake()->randomElement(AcademicLevels::options());
        $sectionName = fake()->randomElement(['Aguinaldo', 'Bonifacio', 'Del Pilar', 'Jacinto', 'Mabini', 'Rizal']);

        return [
            'registered_visitor_id' => RegisteredVisitor::factory()->student(),
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
