# Database Refactor Notes

The first database refactor has been applied as a naming-clarity refactor. It keeps behavior the same while making the tables easier to understand.

## Applied Rename

- `registered_visitors` -> `library_members`
- `registered_visitor_id` -> `library_member_id`
- `student_registrations` -> `student_school_year_records`
- `employee_profiles` -> `employee_school_year_records`
- `RegisteredVisitor` -> `LibraryMember`
- `StudentRegistration` -> `StudentSchoolYearRecord`
- `EmployeeProfile` -> `EmployeeSchoolYearRecord`

## What Stayed The Same

- The staff-facing admin page can still be called Registered Visitors.
- Visit scanning behavior stays the same.
- Import rules stay the same.
- Active school-year scoping stays the same.
- Historical report output stays the same.
- Required visit progress logic stays the same.
- Student year/section and employee department filtering stay the same.

## Why Snapshot Columns Remain

The copied name, school ID, RFID, and photo fields inside student/employee school-year records are still useful for historical reports.

If a student's current name, ID, or photo changes later, old reports can still show the details saved for that school year.

## Future Optional Refactor

A later normalization pass could remove snapshot columns and rely only on `library_members` for current identity details. If historical accuracy is still required, that should be paired with a dedicated identity-history table.

That future pass is intentionally separate from this one because the goal here is readability without changing working behavior.
