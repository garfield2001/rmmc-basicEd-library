<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $visitMemberColumnWasRenamed = false;
        $studentMemberColumnWasRenamed = false;
        $employeeMemberColumnWasRenamed = false;

        $this->dropForeignIfPresent('library_visits', 'registered_visitor_id');
        $this->dropForeignIfPresent('student_registrations', 'registered_visitor_id');
        $this->dropForeignIfPresent('employee_profiles', 'registered_visitor_id');

        $this->renameTableIfNeeded('registered_visitors', 'library_members');
        $this->renameTableIfNeeded('student_registrations', 'student_school_year_records');
        $this->renameTableIfNeeded('employee_profiles', 'employee_school_year_records');

        $visitMemberColumnWasRenamed = $this->renameColumnIfNeeded('library_visits', 'registered_visitor_id', 'library_member_id');
        $studentMemberColumnWasRenamed = $this->renameColumnIfNeeded('student_school_year_records', 'registered_visitor_id', 'library_member_id');
        $employeeMemberColumnWasRenamed = $this->renameColumnIfNeeded('employee_school_year_records', 'registered_visitor_id', 'library_member_id');

        if ($visitMemberColumnWasRenamed) {
            $this->addLibraryMemberForeign('library_visits');
        }

        if ($studentMemberColumnWasRenamed) {
            $this->addLibraryMemberForeign('student_school_year_records');
        }

        if ($employeeMemberColumnWasRenamed) {
            $this->addLibraryMemberForeign('employee_school_year_records');
        }
    }

    public function down(): void
    {
        $visitMemberColumnWasRenamed = false;
        $studentMemberColumnWasRenamed = false;
        $employeeMemberColumnWasRenamed = false;

        $this->dropForeignIfPresent('library_visits', 'library_member_id');
        $this->dropForeignIfPresent('student_school_year_records', 'library_member_id');
        $this->dropForeignIfPresent('employee_school_year_records', 'library_member_id');

        $visitMemberColumnWasRenamed = $this->renameColumnIfNeeded('library_visits', 'library_member_id', 'registered_visitor_id');
        $studentMemberColumnWasRenamed = $this->renameColumnIfNeeded('student_school_year_records', 'library_member_id', 'registered_visitor_id');
        $employeeMemberColumnWasRenamed = $this->renameColumnIfNeeded('employee_school_year_records', 'library_member_id', 'registered_visitor_id');

        $this->renameTableIfNeeded('employee_school_year_records', 'employee_profiles');
        $this->renameTableIfNeeded('student_school_year_records', 'student_registrations');
        $this->renameTableIfNeeded('library_members', 'registered_visitors');

        if ($visitMemberColumnWasRenamed) {
            $this->addRegisteredVisitorForeign('library_visits');
        }

        if ($studentMemberColumnWasRenamed) {
            $this->addRegisteredVisitorForeign('student_registrations');
        }

        if ($employeeMemberColumnWasRenamed) {
            $this->addRegisteredVisitorForeign('employee_profiles');
        }
    }

    private function renameTableIfNeeded(string $from, string $to): void
    {
        if (Schema::hasTable($from) && ! Schema::hasTable($to)) {
            Schema::rename($from, $to);
        }
    }

    private function renameColumnIfNeeded(string $table, string $from, string $to): bool
    {
        if (! Schema::hasTable($table) || ! Schema::hasColumn($table, $from) || Schema::hasColumn($table, $to)) {
            return false;
        }

        Schema::table($table, function (Blueprint $table) use ($from, $to): void {
            $table->renameColumn($from, $to);
        });

        return true;
    }

    private function dropForeignIfPresent(string $table, string $column): void
    {
        if (! Schema::hasTable($table) || ! Schema::hasColumn($table, $column)) {
            return;
        }

        Schema::table($table, function (Blueprint $table) use ($column): void {
            $table->dropForeign([$column]);
        });
    }

    private function addLibraryMemberForeign(string $table): void
    {
        if (! Schema::hasTable($table) || ! Schema::hasColumn($table, 'library_member_id')) {
            return;
        }

        Schema::table($table, function (Blueprint $table): void {
            $table->foreign('library_member_id')->references('id')->on('library_members')->cascadeOnDelete();
        });
    }

    private function addRegisteredVisitorForeign(string $table): void
    {
        if (! Schema::hasTable($table) || ! Schema::hasColumn($table, 'registered_visitor_id')) {
            return;
        }

        Schema::table($table, function (Blueprint $table): void {
            $table->foreign('registered_visitor_id')->references('id')->on('registered_visitors')->cascadeOnDelete();
        });
    }
};
