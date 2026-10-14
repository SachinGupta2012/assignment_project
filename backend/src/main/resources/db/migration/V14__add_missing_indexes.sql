-- BRD section 9: index login lookup, course search, enrollment status,
-- due date, assessment grading status, and report date filters.
-- (users.email is already indexed via its UNIQUE constraint.)
create index if not exists idx_courses_search on courses(level, is_published, is_archived);
create index if not exists idx_courses_title on courses(title);
create index if not exists idx_enrollments_status on enrollments(status);
create index if not exists idx_enrollments_due on enrollments(due_date);
create index if not exists idx_enrollments_created on enrollments(created_at);
create index if not exists idx_attempt_answers_grader on attempt_answers(graded_by);
create index if not exists idx_assessment_attempts_submitted on assessment_attempts(submitted_at);
create index if not exists idx_notifications_user on notifications(user_id);
