create table if not exists assessment_attempts(
    id bigserial primary key,
    assessment_id bigint not null references assessments(id) on delete cascade,
    learner_id bigint not null references users(id),
    attempt_number int not null,
    status varchar(30) not null default 'in_progress',
    score numeric not null default 0,
    max_score numeric not null default 0,
    percentage numeric,
    passed boolean,
    started_at timestamp with time zone not null default now(),
    submitted_at timestamp with time zone,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    constraint uq_attempt unique(assessment_id, learner_id, attempt_number)
);

create table if not exists attempt_answers(
    id bigserial primary key,
    attempt_id bigint not null references assessment_attempts(id) on delete cascade,
    question_id bigint not null references questions(id),
    question_text text not null,
    points numeric not null,
    selected_option_id bigint references question_options(id),
    selected_option_text text,
    answer_text text,
    is_correct boolean,
    points_awarded numeric not null default 0,
    feedback text,
    graded_by bigint references users(id),
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    constraint uq_answer unique(attempt_id, question_id, selected_option_id)
);
