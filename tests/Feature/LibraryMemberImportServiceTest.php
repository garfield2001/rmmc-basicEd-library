<?php

namespace Tests\Feature;

use App\Models\EmployeeSchoolYearRecord;
use App\Models\LibraryMember;
use App\Models\SchoolYear;
use App\Models\StudentSchoolYearRecord;
use App\Services\Library\LibraryMemberImportService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class LibraryMemberImportServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_import_requires_an_active_school_year_first(): void
    {
        $this->expectException(ValidationException::class);

        app(LibraryMemberImportService::class)->import($this->csvUpload(<<<'CSV'
first_name,last_name,year_level,section
Juan,Dela Cruz,Grade 5,Rizal
CSV));
    }

    public function test_import_preview_lists_members_without_saving_them(): void
    {
        $this->activeSchoolYear();

        $preview = app(LibraryMemberImportService::class)->preview($this->csvUpload(<<<'CSV'
first_name,middle_name,last_name,school_id,year_level,section
JOLINA SHANE,TABLINGON,VELASCO,1000000001,Grade 10,Diamond
INCOMPLETE,,,
CSV));

        $this->assertSame(2, $preview['total_rows']);
        $this->assertSame(1, $preview['importable_count']);
        $this->assertSame(1, $preview['skipped_count']);
        $this->assertSame('Jolina Shane T. Velasco', $preview['members'][0]['name']);
        $this->assertSame('create', $preview['members'][0]['status']);
        $this->assertSame(0, LibraryMember::query()->count());
    }

    public function test_import_rejects_rows_without_school_id(): void
    {
        $this->activeSchoolYear();

        $summary = app(LibraryMemberImportService::class)->import($this->csvUpload(<<<'CSV'
first_name,middle_name,last_name,year_level,section
Juan,Santos,Dela Cruz,Gradfe 5,Hydrogen
CSV));

        $this->assertSame(0, $summary['created']);
        $this->assertSame(1, $summary['skipped']);
        $this->assertSame(0, LibraryMember::query()->count());
    }

    public function test_school_id_reimport_skips_existing_active_year_student_details(): void
    {
        $this->activeSchoolYear();
        $imports = app(LibraryMemberImportService::class);

        $summary = $imports->import($this->csvUpload(<<<'CSV'
first_name,middle_name,last_name,school_id,year_level,section
Juan,Santos,Dela Cruz,1000000001,Grade 5,Hydrogen
CSV));

        $this->assertSame(1, $summary['created']);
        $visitor = LibraryMember::query()->where('school_id', '1000000001')->firstOrFail();

        $summary = $imports->import($this->csvUpload(<<<'CSV'
first_name,middle_name,last_name,school_id,year_level,section
Juan,Santos,Dela Cruz,1000000001,Grade 5,Rizal
CSV));

        $this->assertSame(0, $summary['created']);
        $this->assertSame(0, $summary['updated']);
        $this->assertSame(1, $summary['skipped']);
        $this->assertSame(1, LibraryMember::query()->count());
        $this->assertSame('1000000001', $visitor->refresh()->school_id);
        $this->assertSame('Juan', $visitor->first_name);
        $this->assertSame('Santos', $visitor->middle_name);
        $this->assertSame('Dela Cruz', $visitor->last_name);
        $this->assertDatabaseHas('student_school_year_records', [
            'library_member_id' => $visitor->id,
            'year_level' => 'Grade 5',
            'section' => 'Hydrogen',
        ]);
    }

    public function test_reimport_with_rfid_fills_missing_rfid_only(): void
    {
        $this->activeSchoolYear();
        $imports = app(LibraryMemberImportService::class);

        $imports->import($this->csvUpload(<<<'CSV'
first_name,middle_name,last_name,school_id
Maria,Lourdes,Esperas,1000000123
CSV));

        $visitor = LibraryMember::query()->where('last_name', 'Esperas')->firstOrFail();

        $summary = $imports->import($this->csvUpload(<<<'CSV'
first_name,last_name,rfid_uid,school_id
Maria,Esperas,1234567890,1000000123
CSV));

        $this->assertSame(0, $summary['created']);
        $this->assertSame(1, $summary['updated']);
        $this->assertSame('1234567890', $visitor->refresh()->rfid_uid);
        $this->assertSame('1000000123', $visitor->school_id);
        $this->assertSame(1, LibraryMember::query()->where('last_name', 'Esperas')->count());
    }

    public function test_import_normalizes_flexible_grade_names(): void
    {
        $this->activeSchoolYear();

        app(LibraryMemberImportService::class)->import($this->csvUpload(<<<'CSV'
first_name,middle_name,last_name,school_id,year_level,section
One,A,Student,1000000001,1,A
Two,B,Student,1000000002,G2,B
Three,C,Student,1000000003,g3,C
Four,D,Student,1000000004,4,D
Five,E,Student,1000000005,Gradfe 5,E
Six,F,Student,1000000006,grade 6,F
CSV));

        $this->assertSame(
            ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'],
            StudentSchoolYearRecord::query()->orderBy('id')->pluck('year_level')->all(),
        );
    }

    public function test_import_reads_school_id_from_class_list_column_after_lrn(): void
    {
        $this->activeSchoolYear();

        $summary = app(LibraryMemberImportService::class)->import($this->csvUpload(<<<'CSV'
no,last_name,first_name,middle_name,lrn,school_id,year_level,section
1,AHAT,JOSHUA REUEL,ABELLA,405843160004,1231231231,Grade 7,Zircon
CSV));

        $this->assertSame(1, $summary['created']);
        $this->assertDatabaseHas('library_members', [
            'first_name' => 'Joshua Reuel',
            'middle_name' => 'Abella',
            'last_name' => 'Ahat',
            'school_id' => '1231231231',
        ]);
    }

    public function test_import_accepts_long_school_id_and_skips_same_identity_with_different_school_id(): void
    {
        $this->activeSchoolYear();
        $imports = app(LibraryMemberImportService::class);

        $summary = $imports->import($this->csvUpload(<<<'CSV'
first_name,middle_name,last_name,school_id,rfid_uid
ANDRINO,PHILLIP VIKTOR,GAMOTIN,402048180005,1231233332
CSV));

        $this->assertSame(1, $summary['created']);
        $this->assertDatabaseHas('library_members', [
            'first_name' => 'Andrino',
            'middle_name' => 'Phillip Viktor',
            'last_name' => 'Gamotin',
            'school_id' => '402048180005',
            'rfid_uid' => '1231233332',
        ]);

        $summary = $imports->import($this->csvUpload(<<<'CSV'
first_name,middle_name,last_name,school_id
ANDRINO,PHILLIP VIKTOR,GAMOTIN,999999999999
CSV));

        $this->assertSame(0, $summary['created']);
        $this->assertSame(1, $summary['skipped']);
        $this->assertSame(1, LibraryMember::query()->where('last_name', 'Gamotin')->count());
    }

    public function test_import_skips_same_name_students_with_different_school_id(): void
    {
        $this->activeSchoolYear();

        $summary = app(LibraryMemberImportService::class)->import($this->csvUpload(<<<'CSV'
first_name,middle_name,last_name,school_id,year_level,section
Juan,Santos,Dela Cruz,1000000001,Grade 5,Hydrogen
Juan,Santos,Dela Cruz,1000000002,Grade 5,Hydrogen
CSV));

        $this->assertSame(1, $summary['created']);
        $this->assertSame(1, $summary['skipped']);
        $this->assertSame(1, LibraryMember::query()->where('first_name', 'Juan')->where('last_name', 'Dela Cruz')->count());
    }

    public function test_import_uses_active_school_year_and_ignores_non_app_identifiers(): void
    {
        $activeSchoolYear = $this->activeSchoolYear();

        app(LibraryMemberImportService::class)->import($this->csvUpload(<<<'CSV'
first_name,middle_name,last_name,school_id,LRN,school_year,year_level,section
Juan,Santos,Dela Cruz,1000000001,123456789012,1999-2000,G5,Rizal
CSV));

        $visitor = LibraryMember::query()->firstOrFail();

        $this->assertSame('1000000001', $visitor->school_id);
        $this->assertSame(1, SchoolYear::query()->count());
        $this->assertDatabaseHas('student_school_year_records', [
            'library_member_id' => $visitor->id,
            'school_year_id' => $activeSchoolYear->id,
            'year_level' => 'Grade 5',
            'section' => 'Rizal',
        ]);
    }

    public function test_import_skips_rows_when_name_is_too_incomplete(): void
    {
        $this->activeSchoolYear();

        $summary = app(LibraryMemberImportService::class)->import($this->csvUpload(<<<'CSV'
type,first_name,middle_name,last_name,school_id,year_level,section,department
student,Juan,,,1000000001,Grade 5,Rizal,
student,Juan,Santos,,1000000002,Grade 5,Rizal,
employee,Ana,,,2000000001,,,
employee,Ana,Marie,,2000000002,,,Faculty
student,Juan,,Dela Cruz,1000000003,Grade 5,Rizal,
employee,Ana,,Reyes,2000000003,,,Faculty
student,Ana,Marie,Reyes,1000000004,Grade 6,Mabini,
employee,Cora,Mae,Santos,2000000004,,,Faculty
CSV));

        $this->assertSame(4, $summary['created']);
        $this->assertSame(4, $summary['skipped']);
        $this->assertSame(4, LibraryMember::query()->count());
        $this->assertDatabaseHas('library_members', [
            'first_name' => 'Juan',
            'middle_name' => null,
            'last_name' => 'Dela Cruz',
            'type' => LibraryMember::TYPE_STUDENT,
        ]);
        $this->assertDatabaseHas('library_members', [
            'first_name' => 'Ana',
            'middle_name' => null,
            'last_name' => 'Reyes',
            'type' => LibraryMember::TYPE_EMPLOYEE,
        ]);
        $this->assertDatabaseHas('library_members', [
            'first_name' => 'Ana',
            'middle_name' => 'Marie',
            'last_name' => 'Reyes',
            'type' => LibraryMember::TYPE_STUDENT,
        ]);
        $this->assertDatabaseHas('library_members', [
            'first_name' => 'Cora',
            'middle_name' => 'Mae',
            'last_name' => 'Santos',
            'type' => LibraryMember::TYPE_EMPLOYEE,
        ]);
    }

    public function test_import_accepts_rows_without_middle_name_column(): void
    {
        $this->activeSchoolYear();

        $summary = app(LibraryMemberImportService::class)->import($this->csvUpload(<<<'CSV'
type,first_name,last_name,school_id,year_level,department
student,Juan,Dela Cruz,1000000001,Grade 5,
employee,Ana,Reyes,2000000001,,Faculty
CSV));

        $this->assertSame(2, $summary['created']);
        $this->assertSame(0, $summary['skipped']);
        $this->assertSame(2, LibraryMember::query()->count());
    }

    public function test_reimport_does_not_fill_profile_or_detail_gaps(): void
    {
        $this->activeSchoolYear();
        $imports = app(LibraryMemberImportService::class);

        $imports->import($this->csvUpload(<<<'CSV'
first_name,middle_name,last_name,school_id,year_level,section
Juan,Santos,Dela Cruz,1000000001,G5,
CSV));

        $visitor = LibraryMember::query()->where('school_id', '1000000001')->firstOrFail();

        $summary = $imports->import($this->csvUpload(<<<'CSV'
first_name,middle_name,last_name,school_id,year_level,section
Juan,Santos,Dela Cruz,1000000001,G5,Rizal
CSV));

        $this->assertSame(0, $summary['updated']);
        $this->assertSame(1, $summary['skipped']);
        $this->assertSame('Santos', $visitor->refresh()->middle_name);
        $this->assertDatabaseHas('student_school_year_records', [
            'library_member_id' => $visitor->id,
            'year_level' => 'Grade 5',
            'section' => null,
        ]);

        $imports->import($this->csvUpload(<<<'CSV'
first_name,middle_name,last_name,school_id,year_level,section
Juan,Santos,Dela Cruz,1000000001,G5,
CSV));

        $this->assertSame('Santos', $visitor->refresh()->middle_name);
        $this->assertDatabaseHas('student_school_year_records', [
            'library_member_id' => $visitor->id,
            'year_level' => 'Grade 5',
            'section' => null,
        ]);
    }

    public function test_import_skips_full_name_column_instead_of_splitting_it(): void
    {
        $this->activeSchoolYear();
        $imports = app(LibraryMemberImportService::class);

        $imports->import($this->csvUpload(<<<'CSV'
first_name,middle_name,last_name,school_id,year_level,section
JOLINA SHANE,TABLINGON,VELASCO,1000000001,Grade 10,Diamond
CSV));

        $visitor = LibraryMember::query()->where('last_name', 'Velasco')->firstOrFail();

        $summary = $imports->import($this->csvUpload(<<<'CSV'
name,school_id
Jolina Shane T. Velasco,1231231231
CSV));

        $this->assertSame(0, $summary['created']);
        $this->assertSame(0, $summary['updated']);
        $this->assertSame(1, $summary['skipped']);
        $this->assertSame(1, LibraryMember::query()->where('last_name', 'Velasco')->count());
        $this->assertSame('1000000001', $visitor->refresh()->school_id);
        $this->assertSame('Jolina Shane', $visitor->first_name);
        $this->assertSame('Tablingon', $visitor->middle_name);
        $this->assertSame('Velasco', $visitor->last_name);
    }

    public function test_preview_rejects_full_given_name_columns(): void
    {
        $this->activeSchoolYear();

        $preview = app(LibraryMemberImportService::class)->preview($this->csvUpload(<<<'CSV'
full_given_name,school_id
Maria Lourdes Esperas,1000000001
CSV));

        $this->assertSame(0, $preview['importable_count']);
        $this->assertSame(1, $preview['skipped_count']);
        $this->assertStringContainsString('Full-name columns are not accepted', $preview['skipped'][0]['reason']);
    }

    public function test_preview_rejects_school_id_with_different_existing_identity(): void
    {
        $this->activeSchoolYear();
        $imports = app(LibraryMemberImportService::class);

        $imports->import($this->csvUpload(<<<'CSV'
first_name,middle_name,last_name,school_id,year_level,section
Juan,,Dela Cruz,1000000001,Grade 5,Rizal
CSV));

        $preview = $imports->preview($this->csvUpload(<<<'CSV'
first_name,middle_name,last_name,school_id,year_level,section
Juan,Santos,Dela Cruz,1000000001,Grade 5,Rizal
CSV));

        $this->assertSame(0, $preview['importable_count']);
        $this->assertSame(1, $preview['skipped_count']);
        $this->assertStringContainsString('School ID 1000000001 is already registered', $preview['skipped'][0]['reason']);
        $this->assertSame(1, LibraryMember::query()->count());
    }

    public function test_preview_blocks_school_id_assigned_to_another_student(): void
    {
        $this->activeSchoolYear();
        $imports = app(LibraryMemberImportService::class);

        $imports->import($this->csvUpload(<<<'CSV'
first_name,middle_name,last_name,school_id,year_level,section
Abdulmatin,M,Almontezerie,1231231232,Grade 8,Ruby
CSV));

        $preview = $imports->preview($this->csvUpload(<<<'CSV'
first_name,middle_name,last_name,school_id,year_level,section
Zyrine Mhay,Romero,Zaulda,1231231232,Grade 8,Ruby
CSV));

        $this->assertSame(0, $preview['importable_count']);
        $this->assertSame(1, $preview['skipped_count']);
        $this->assertStringContainsString('School ID 1231231232 already belongs to Abdulmatin M. Almontezerie', $preview['skipped'][0]['reason']);

        $summary = $imports->import($this->csvUpload(<<<'CSV'
first_name,middle_name,last_name,school_id,year_level,section
Zyrine Mhay,Romero,Zaulda,1231231232,Grade 8,Ruby
CSV));

        $this->assertSame(0, $summary['created']);
        $this->assertSame(0, $summary['updated']);
        $this->assertSame(1, $summary['skipped']);
        $this->assertSame(1, LibraryMember::query()->count());
        $this->assertDatabaseMissing('library_members', [
            'first_name' => 'Zyrine Mhay',
            'last_name' => 'Zaulda',
            'school_id' => '1231231232',
        ]);
    }

    public function test_preview_rejects_import_without_school_id(): void
    {
        $this->activeSchoolYear();

        $preview = app(LibraryMemberImportService::class)->preview($this->csvUpload(<<<'CSV'
first_name,middle_name,last_name,year_level,section
Juan,Santos,Dela Cruz,Grade 5,Rizal
CSV));

        $this->assertSame(0, $preview['importable_count']);
        $this->assertSame(1, $preview['skipped_count']);
        $this->assertStringContainsString('School ID column is required', $preview['skipped'][0]['reason']);
    }

    public function test_partial_name_with_different_school_id_creates_separate_visitor(): void
    {
        $this->activeSchoolYear();
        $imports = app(LibraryMemberImportService::class);

        $imports->import($this->csvUpload(<<<'CSV'
first_name,middle_name,last_name,school_id,year_level,section
Zyrine Mhay,Romero,Zaulda,1000000001,Grade 8,Ruby
CSV));

        $preview = $imports->preview($this->csvUpload(<<<'CSV'
first_name,middle_name,last_name,school_id
Zyrine,Romero,Zaulda,1231231231
CSV));

        $this->assertSame('create', $preview['members'][0]['status']);
        $this->assertNull($preview['members'][0]['matched_name']);
    }

    public function test_import_rejects_rfid_that_belongs_to_another_school_id(): void
    {
        $this->activeSchoolYear();
        $imports = app(LibraryMemberImportService::class);

        $imports->import($this->csvUpload(<<<'CSV'
first_name,middle_name,last_name,school_id,rfid_uid,year_level,section
Joshua Reuel,Abella,Ahat,1231231231,1234567890,Grade 7,Zircon
CSV));

        $preview = $imports->preview($this->csvUpload(<<<'CSV'
first_name,middle_name,last_name,school_id,rfid_uid
Zyrine,Romero,Zaulda,1000000001,1234567890
CSV));

        $this->assertSame(0, $preview['importable_count']);
        $this->assertSame(1, $preview['skipped_count']);
        $this->assertStringContainsString('RFID 1234567890 already belongs to Joshua Reuel A. Ahat', $preview['skipped'][0]['reason']);

        $summary = $imports->import($this->csvUpload(<<<'CSV'
first_name,middle_name,last_name,school_id,rfid_uid
Zyrine,Romero,Zaulda,1000000001,1234567890
CSV));

        $this->assertSame(0, $summary['created']);
        $this->assertSame(0, $summary['updated']);
        $this->assertSame(1, $summary['skipped']);
        $this->assertDatabaseHas('library_members', [
            'first_name' => 'Joshua Reuel',
            'last_name' => 'Ahat',
            'school_id' => '1231231231',
        ]);
        $this->assertDatabaseMissing('library_members', [
            'first_name' => 'Zyrine',
            'last_name' => 'Zaulda',
        ]);
    }

    public function test_school_id_with_different_existing_identity_is_skipped(): void
    {
        $this->activeSchoolYear();
        $imports = app(LibraryMemberImportService::class);

        $imports->import($this->csvUpload(<<<'CSV'
first_name,middle_name,last_name,school_id,year_level,section
Juan,Santos,Dela Cruz,1000000001,Grade 5,Rizal
CSV));

        $visitor = LibraryMember::query()->firstOrFail();

        $summary = $imports->import($this->csvUpload(<<<'CSV'
first_name,middle_name,last_name,school_id,year_level,section
Juan Miguel,Santos,Dela Cruz,1000000001,Grade 5,Rizal
CSV));

        $this->assertSame(0, $summary['created']);
        $this->assertSame(0, $summary['updated']);
        $this->assertSame(1, $summary['skipped']);
        $this->assertSame(1, LibraryMember::query()->count());
        $this->assertSame('Juan', $visitor->refresh()->first_name);
        $this->assertSame('Santos', $visitor->middle_name);
        $this->assertSame('1000000001', $visitor->school_id);
    }

    public function test_import_adds_missing_rfid_but_does_not_replace_student_details_for_existing_school_id(): void
    {
        $this->activeSchoolYear();
        $imports = app(LibraryMemberImportService::class);

        $imports->import($this->csvUpload(<<<'CSV'
first_name,middle_name,last_name,school_id,year_level,section
Maria,Lourdes,Esperas,1000000123,Grade 5,Rizal
CSV));

        $visitor = LibraryMember::query()->where('school_id', '1000000123')->firstOrFail();

        $summary = $imports->import($this->csvUpload(<<<'CSV'
first_name,middle_name,last_name,school_id,rfid_uid,year_level,section
Maria,Lourdes,Esperas,1000000123,1234567890,Grade 5,Hydrogen
CSV));

        $this->assertSame(0, $summary['created']);
        $this->assertSame(1, $summary['updated']);
        $this->assertSame('1234567890', $visitor->refresh()->rfid_uid);
        $this->assertDatabaseHas('student_school_year_records', [
            'library_member_id' => $visitor->id,
            'year_level' => 'Grade 5',
            'section' => 'Rizal',
        ]);
    }

    public function test_exact_name_identifier_reimports_are_skipped_without_missing_rfid(): void
    {
        $this->activeSchoolYear();
        $imports = app(LibraryMemberImportService::class);

        $imports->import($this->csvUpload(<<<'CSV'
first_name,middle_name,last_name,school_id,year_level,section
Juan,Santos,Dela Cruz,1000000001,Grade 5,Rizal
Ana,Marie,Reyes,1000000002,Grade 5,Rizal
CSV));

        $preview = $imports->preview($this->csvUpload(<<<'CSV'
first_name,middle_name,last_name,school_id,year_level,section
Juan,Santos,Dela Cruz,1000000001,Grade 5,Rizal
Ana,Marie,Reyes,1000000002,Grade 5,Rizal
CSV));

        $this->assertSame([], collect($preview['members'])->pluck('status')->all());
        $this->assertSame(0, $preview['update_count']);
        $this->assertSame(2, $preview['skipped_count']);

        $summary = $imports->import($this->csvUpload(<<<'CSV'
first_name,middle_name,last_name,school_id,year_level,section
Juan,Santos,Dela Cruz,1000000001,Grade 5,Rizal
Ana,Marie,Reyes,1000000002,Grade 5,Rizal
CSV));

        $this->assertSame(0, $summary['created']);
        $this->assertSame(0, $summary['updated']);
        $this->assertSame(2, $summary['skipped']);
        $this->assertSame(2, LibraryMember::query()->count());
        $this->assertSame(1, LibraryMember::query()->where('first_name', 'Juan')->where('last_name', 'Dela Cruz')->count());
        $this->assertSame(1, LibraryMember::query()->where('first_name', 'Ana')->where('last_name', 'Reyes')->count());
        $this->assertDatabaseHas('library_members', [
            'first_name' => 'Juan',
            'school_id' => '1000000001',
        ]);
        $this->assertDatabaseHas('library_members', [
            'first_name' => 'Ana',
            'school_id' => '1000000002',
        ]);
    }

    public function test_duplicate_names_do_not_update_by_school_id(): void
    {
        $this->activeSchoolYear();
        $imports = app(LibraryMemberImportService::class);

        $imports->import($this->csvUpload(<<<'CSV'
first_name,middle_name,last_name,school_id,year_level,section
Juan,Santos,Dela Cruz,1000000001,Grade 5,Rizal
Juan,Santos,Dela Cruz,1000000002,Grade 5,Rizal
CSV));

        $summary = $imports->import($this->csvUpload(<<<'CSV'
first_name,middle_name,last_name,school_id,year_level,section
Juan Miguel,Santos,Dela Cruz,1000000001,Grade 5,Rizal
CSV));

        $this->assertSame(0, $summary['created']);
        $this->assertSame(0, $summary['updated']);
        $this->assertSame(1, $summary['skipped']);
        $this->assertSame(1, LibraryMember::query()->where('last_name', 'Dela Cruz')->count());
        $this->assertDatabaseMissing('library_members', [
            'first_name' => 'Juan Miguel',
            'school_id' => '1000000001',
        ]);
        $this->assertDatabaseHas('library_members', [
            'first_name' => 'Juan',
            'school_id' => '1000000001',
        ]);
        $this->assertDatabaseMissing('library_members', [
            'first_name' => 'Juan',
            'school_id' => '1000000002',
        ]);
    }

    public function test_employee_reimport_preserves_existing_department_when_file_has_no_department(): void
    {
        $this->activeSchoolYear();
        $imports = app(LibraryMemberImportService::class);

        $imports->import($this->csvUpload(<<<'CSV'
type,first_name,middle_name,last_name,school_id,department
employee,Ana,,Reyes,2000000001,Faculty
CSV));

        $employee = LibraryMember::query()->where('school_id', '2000000001')->firstOrFail();

        $imports->import($this->csvUpload(<<<'CSV'
type,first_name,middle_name,last_name,school_id
employee,Ana,,Reyes,2000000001
CSV));

        $this->assertSame(1, EmployeeSchoolYearRecord::query()->where('library_member_id', $employee->id)->count());
        $this->assertDatabaseHas('employee_school_year_records', [
            'library_member_id' => $employee->id,
            'department' => 'Faculty',
        ]);
    }

    public function test_import_reads_simple_pdf_roster(): void
    {
        $this->activeSchoolYear();

        $summary = app(LibraryMemberImportService::class)->import($this->pdfUpload(<<<'TEXT'
Grade 5 Hydrogen
LAST NAME  FIRST NAME  MIDDLE NAME  SCHOOL ID
Dela Cruz  Juan  Santos  1000000001
Reyes  Ana  Marie  1000000002
TEXT));

        $this->assertSame(2, $summary['created']);
        $this->assertSame(0, $summary['skipped']);
        $this->assertDatabaseHas('student_school_year_records', [
            'year_level' => 'Grade 5',
            'section' => 'Hydrogen',
            'first_name' => 'Juan',
            'middle_name' => 'Santos',
            'last_name' => 'Dela Cruz',
        ]);
        $this->assertDatabaseHas('student_school_year_records', [
            'year_level' => 'Grade 5',
            'section' => 'Hydrogen',
            'first_name' => 'Ana',
            'middle_name' => 'Marie',
            'last_name' => 'Reyes',
        ]);
    }

    private function activeSchoolYear(): SchoolYear
    {
        return SchoolYear::factory()->active()->create([
            'name' => '2026-2027',
            'starts_at' => '2026-05-01',
            'ends_at' => '2027-03-07',
        ]);
    }

    private function csvUpload(string $content): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'visitor-import-');
        file_put_contents($path, $content);

        return new UploadedFile($path, 'visitors.csv', 'text/csv', null, true);
    }

    private function pdfUpload(string $text): UploadedFile
    {
        $stream = "BT /F1 12 Tf 72 720 Td\n";

        foreach (preg_split('/\R/', $text) ?: [] as $line) {
            $escaped = str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $line);
            $stream .= "({$escaped}) Tj T*\n";
        }

        $stream .= 'ET';
        $pdf = "%PDF-1.4\n1 0 obj\n<< /Length ".strlen($stream)." >>\nstream\n{$stream}\nendstream\nendobj\n%%EOF";
        $path = tempnam(sys_get_temp_dir(), 'visitor-import-pdf-');
        file_put_contents($path, $pdf);

        return new UploadedFile($path, 'visitors.pdf', 'application/pdf', null, true);
    }
}
