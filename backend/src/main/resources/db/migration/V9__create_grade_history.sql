-- V3 created grade_corrections for an older grades-based design
-- (grade_id, previous_score, corrected_by). Grading is now recorded per
-- attempt answer, so replace the table with the new shape.
-- V3 also created attempts, responses, grades and lesson_progress, which are
-- superseded by the V8 (assessment_attempts, attempt_answers) and V10
-- (lesson_completions) tables, so remove those as well.
drop table if exists grade_corrections;
drop table if exists grades;
drop table if exists responses;
drop table if exists attempts;
drop table if exists lesson_progress;

create table grade_corrections(
    id bigserial primary key,
    answer_id bigint not null references attempt_answers(id) on delete cascade,
    old_points numeric not null,
    new_points numeric not null,
    editor_id bigint not null references users(id),
    reason text not null,
    created_at timestamp with time zone not null default now()
);
