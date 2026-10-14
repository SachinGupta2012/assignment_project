create table if not exists questions(
    id bigserial primary key,
    assessment_id bigint not null references assessments(id) on delete cascade,
    question_text text not null,
    question_type varchar(30) not null,
    points numeric not null,
    correct_answer text,
    explanation text,
    display_order int,
    created_by bigint not null references users(id),
    updated_by bigint references users(id),
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now()
);

create table if not exists question_options(
    id bigserial primary key,
    question_id bigint not null references questions(id) on delete cascade,
    option_text text not null,
    is_correct boolean not null default false,
    display_order int,
    created_at timestamp with time zone not null default now()
);