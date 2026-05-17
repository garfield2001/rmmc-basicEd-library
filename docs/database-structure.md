# Database Structure Notes

This app currently uses a person identity plus school-year profile pattern.

## Main Idea

`registered_visitors` is the permanent library identity for a person. It stores the RFID/card identity, school ID, visitor type, name, and photo that the scanner and admin screens can use as the person's current base record.

`student_registrations` and `employee_profiles` are school-year records. They connect a registered visitor to a specific `school_year_id`, then store the school-year details used by reports.

That means a person can stay the same registered visitor while their yearly details change.

Example:

- `registered_visitors`: Juan Dela Cruz, student, RFID 12345
- `student_registrations`: Juan in `2025-2026`, `Grade 1 - Rizal`
- `student_registrations`: Juan in `2026-2027`, `Grade 2 - Bonifacio`

## Tables

### school_years

Stores each school year, such as `2025-2026`, including start/end dates and required visit counts for students and employees.

Reports and visits are scoped to a school year so progress resets each year.

### registered_visitors

Stores the base visitor/person record:

- `rfid_uid`
- `school_id`
- `type`: `student` or `employee`
- name fields
- photo

This is the table `library_visits` points to.

### school_year_sections

Stores section choices for a given school year and year level.

Example:

- `2026-2027`, `Grade 1`, `Rizal`
- `2026-2027`, `Grade 1`, `Bonifacio`

This table is a controlled list of available class sections. It is not the student assignment itself.

### student_registrations

Stores a student's assignment for one school year:

- the student visitor
- the school year
- the year level
- the section
- an optional link to `school_year_sections`

It also keeps copied name/school ID/RFID/photo fields as a snapshot. That is why it can feel duplicated with `registered_visitors`. The benefit is historical reporting: old reports can still show the student's details for that school year even if the base visitor record changes later.

### employee_profiles

Works like `student_registrations`, but for employees.

It connects an employee visitor to a school year and stores their department for that year. It also keeps copied identity fields as a historical snapshot.

### library_visits

Stores actual scan/visit events:

- visitor
- school year
- visit timestamp

This table is intentionally simple and is the easiest one to reason about.

## Why `student_registrations` May Feel Like It Contradicts `registered_visitors`

The two tables answer different questions:

- `registered_visitors`: Who is this person/card?
- `student_registrations`: Where did this student belong during this school year?

So the duplication is not for active functionality only. It is mainly for preserving school-year history.

## Possible Future Refactor

If you want the database to be more normalized later, the clean version would be:

- `registered_visitors`: only permanent identity fields
- `student_registrations`: only `registered_visitor_id`, `school_year_id`, `school_year_section_id`
- `employee_profiles`: only `registered_visitor_id`, `school_year_id`, `department`
- reports join back to `registered_visitors` for current names/details

The tradeoff: historical reports would show the current name/photo/school ID, not necessarily the old school-year snapshot, unless a separate history/snapshot table is added.

Because the app is currently working, the safer path is to keep this structure and document the intent clearly before doing a full schema refactor.
