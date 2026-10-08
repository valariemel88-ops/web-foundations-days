# School Database Design

## Tables

### Students

The `students` table stores information about each student. It has an `id` primary key, a `name`, and a unique `email` address.

### Courses

The `courses` table stores information about each course. It has an `id` primary key, a course `name`, and a unique course `code`.

### Enrolments

The `enrolments` table records which students are enrolled in which courses. It contains foreign keys to the `students` and `courses` tables, as well as the student's `grade` for the course.

## Relationships

There is a one-to-many relationship between students and enrolments because one student can have many enrolments, while each enrolment belongs to one student.

There is also a one-to-many relationship between courses and enrolments because one course can have many enrolments, while each enrolment belongs to one course.

Students and courses have a many-to-many relationship because one student can take many courses, and one course can have many students. The `enrolments` table is needed as a join table to store the pairs of student IDs and course IDs. It also stores the grade for each enrolment.

## Index

I would add an index on `enrolments.student_id` because the database will often need to find all enrolments belonging to a particular student. An index allows the database to find those rows more quickly instead of scanning every enrolment.