-- V10 created lesson_completions without the created_at audit column
-- that the LessonCompletion entity maps. Add it here.
alter table lesson_completions
    add column created_at timestamp with time zone not null default now();
