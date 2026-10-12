-- deterministic demo users (passwords: Admin@123, Manager@123, Instructor@123, Learner@123)
insert into users (email, password_hash, first_name, last_name, is_active) values
('arjun.nair@lms.com', '$2a$10$4wyUhhlwdS4IBzZ.BH7UF.ojucsCjT37RHFQ.IZt/OHahItLoKU/u', 'Arjun', 'Nair', true),
('priya.sharma@lms.com', '$2a$10$DLptKfIoD4CQ335vZQCLCOxKU.Q0kF/eYbuGg.SRWUXSsP9WYR5jq', 'Priya', 'Sharma', true),
('vikram.singh@lms.com', '$2a$10$wDx58yqh6zQB05GR1CZIW.EYnlIDKPjLZCc6YQIg/B.hRj1XO9lNa', 'Vikram', 'Singh', true),
('ananya.iyer@lms.com', '$2a$10$mnc48tik7XqirG/yjGp2EuirM0l3Wuy1lLQjR8d0Jx6CL60M5V2fq', 'Ananya', 'Iyer', true);

insert into user_roles (user_id, role_id)
select u.id, r.id from users u, roles r
where (u.email = 'arjun.nair@lms.com' and r.name = 'ADMIN')
   or (u.email = 'priya.sharma@lms.com' and r.name = 'TRAINING_MANAGER')
   or (u.email = 'vikram.singh@lms.com' and r.name = 'INSTRUCTOR')
   or (u.email = 'ananya.iyer@lms.com' and r.name = 'LEARNER');

-- demo course chain owned by Vikram (instructor) / created by Arjun (admin)
insert into courses (title, description, instructor_id, is_published, estimated_duration, level, enrollment_mode, is_archived, tags, created_by, updated_by)
select 'Intro to Java', 'Learn Java basics', i.id, true, 40, 'beginner', 'open', false, 'java,programming',
       a.id, a.id
from users i, users a
where i.email = 'vikram.singh@lms.com' and a.email = 'arjun.nair@lms.com';

insert into course_modules (course_id, title, description, display_order, is_required, created_by, updated_by)
select c.id, 'Module 1: Basics', 'Getting started', 1, true, c.created_by, c.created_by
from courses c where c.title = 'Intro to Java';

insert into lessons (module_id, title, content_type, content_body, display_order, is_required, duration, created_by, updated_by)
select m.id, 'Lesson 1: Hello World', 'text', 'Your first Java program.', 1, true, 15, m.created_by, m.created_by
from course_modules m where m.title = 'Module 1: Basics';

insert into assessments (course_id, title, description, passing_score, max_score, max_attempts, is_required, display_order, created_by, updated_by)
select c.id, 'Quiz 1', 'Basics check', 60, 100, 3, true, 1, c.created_by, c.created_by
from courses c where c.title = 'Intro to Java';

insert into questions (assessment_id, question_text, question_type, points, display_order, created_by, updated_by)
select a.id, 'Which keyword defines a class in Java?', 'single_choice', 10, 1, a.created_by, a.created_by
from assessments a where a.title = 'Quiz 1';

insert into question_options (question_id, option_text, is_correct, display_order)
select q.id, 'class', true, 1 from questions q where q.question_text like 'Which keyword%'
union all
select q.id, 'define', false, 2 from questions q where q.question_text like 'Which keyword%';

insert into enrollments (course_id, user_id, status, created_by, updated_by)
select c.id, u.id, 'approved', c.created_by, c.created_by
from courses c, users u
where c.title = 'Intro to Java' and u.email = 'ananya.iyer@lms.com';
