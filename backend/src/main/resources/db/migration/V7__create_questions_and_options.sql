create table if not exists questions(
    id bigserial primary key,
    assessment_id bigint not null references assessments(id) on delete cascade,
    question_text text not null,
    question_type varchar(30) not null default 'mcq',
    display_order int not null default 1,
    marks int not null default 1,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now()
);

create table if not exists question_options(
    id bigserial primary key,
    question_id bigint not null references questions(id) on delete cascade,
    option_text text not null,
    is_correct boolean not null default false,
    display_order int not null default 1
);