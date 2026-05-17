# Database Structure Notes

This app now uses a clearer member plus school-year record pattern.

## Main Idea

`library_members` is the permanent identity table for anyone who can visit the library. It stores RFID/card identity, school ID, visitor type, name, and photo.

`student_school_year_records` and `employee_school_year_records` connect a library member to one school year. These tables store the details that can change every year, such as a student's year level and section or an employee's department.

That means a person can stay the same library member while their school-year details change.

Example:

- `library_members`: Juan Dela Cruz, student, RFID 12345
- `student_school_year_records`: Juan in `2025-2026`, `Grade 1 - Rizal`
- `student_school_year_records`: Juan in `2026-2027`, `Grade 2 - Bonifacio`

The admin UI can still say "Registered Visitors" because that is a familiar staff-facing phrase. In the database and backend code, the clearer developer-facing name is `library_members`.

## Tables

### school_years

Stores each school year, such as `2025-2026`, including start/end dates and required visit counts for students and employees.

Reports, visits, progress, and school-year records are scoped to a school year so progress resets each year.

### library_members

Stores the permanent person/member record:

- `rfid_uid`
- `school_id`
- `type`: `student` or `employee`
- name fields
- photo

This is the table `library_visits` points to through `library_member_id`.

### school_year_sections

Stores section choices for a given school year and year level.

Example:

- `2026-2027`, `Grade 1`, `Rizal`
- `2026-2027`, `Grade 1`, `Bonifacio`

This table is a controlled list of available class sections. It is not the student assignment itself.

### student_school_year_records

Stores a student's assignment for one school year:

- the `library_member_id`
- the `school_year_id`
- the year level
- the section
- an optional link to `school_year_sections`

It also keeps copied name/school ID/RFID/photo fields as a snapshot. The benefit is historical reporting: old reports can still show the student's details for that school year even if the base member record changes later.

### employee_school_year_records

Works like `student_school_year_records`, but for employees.

It connects an employee member to a school year and stores their department for that year. It also keeps copied identity fields as a historical snapshot.

### library_visits

Stores actual scan/visit events:

- `library_member_id`
- `school_year_id`
- visit timestamp

This table is intentionally simple and only records the event itself.

## Why These Names Are Easier

The tables now answer separate questions:

- `library_members`: Who is this person/card?
- `student_school_year_records`: Where did this student belong during this school year?
- `employee_school_year_records`: What department did this employee belong to during this school year?
- `library_visits`: When did this person visit?

This keeps the current behavior but makes the schema easier to read months later.

## Snapshot Columns

The student and employee school-year record tables still keep copied identity fields. That is intentional for now.

Removing those snapshot columns would make the database more normalized, but it could weaken historical reports. For example, if a name, RFID, school ID, or photo changes later, older reports may need to keep showing what was true during that school year.

The current refactor focused on naming clarity without changing the app's behavior.
