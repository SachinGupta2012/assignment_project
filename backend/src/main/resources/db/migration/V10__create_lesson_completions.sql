create table if not exists lesson_completions(
    id bigserial primary key,
    lesson_id bigint not null references lessons(id) on delete cascade,
    learner_id bigint not null references users(id),
    completed_at timestamp with time zone not null default now(),
    constraint uq_completion unique(lesson_id, learner_id)
);
