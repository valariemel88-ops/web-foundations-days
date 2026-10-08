DROP TABLE IF EXISTS enrolments;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS students;

-- Students table
CREATE TABLE students (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
);

-- Courses table
CREATE TABLE courses (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE
);

-- Enrolments join table
CREATE TABLE enrolments (
    id INTEGER PRIMARY KEY,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    grade TEXT,

    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (course_id) REFERENCES courses(id),

    UNIQUE (student_id, course_id)
);

-- Sample students
INSERT INTO students (id, name, email) VALUES
    (1, 'Amina Hassan', 'amina@example.com'),
    (2, 'Brian Otieno', 'brian@example.com'),
    (3, 'Carol Wanjiku', 'carol@example.com');

-- Sample courses
INSERT INTO courses (id, name, code) VALUES
    (1, 'Database Fundamentals', 'DB101'),
    (2, 'Web Development', 'WEB101'),
    (3, 'JavaScript Programming', 'JS101');

-- Sample enrolments
INSERT INTO enrolments (id, student_id, course_id, grade) VALUES
    (1, 1, 1, 'A'),
    (2, 1, 2, 'B+'),
    (3, 2, 1, 'A-'),
    (4, 2, 3, 'B'),
    (5, 3, 2, 'A');

-- Query 1: All courses for one student
SELECT students.name AS student_name,
       courses.name AS course_name,
       enrolments.grade
FROM students
JOIN enrolments ON students.id = enrolments.student_id
JOIN courses ON courses.id = enrolments.course_id
WHERE students.name = 'Amina Hassan';

-- Query 2: All students on one course
SELECT courses.name AS course_name,
       students.name AS student_name,
       enrolments.grade
FROM courses
JOIN enrolments ON courses.id = enrolments.course_id
JOIN students ON students.id = enrolments.student_id
WHERE courses.name = 'Database Fundamentals';

-- Query 3: Number of students per course
SELECT courses.name AS course_name,
       COUNT(enrolments.student_id) AS student_count
FROM courses
LEFT JOIN enrolments ON courses.id = enrolments.course_id
GROUP BY courses.id, courses.name;

-- Query 4: Students who have no enrolments
SELECT students.name,
       students.email
FROM students
LEFT JOIN enrolments ON students.id = enrolments.student_id
WHERE enrolments.id IS NULL;

-- Query 5: Update one enrolment's grade
UPDATE enrolments
SET grade = 'A-'
WHERE student_id = 1
  AND course_id = 2;