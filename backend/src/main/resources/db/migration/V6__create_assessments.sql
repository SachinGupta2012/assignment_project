create table if not exists assessments(
    id bigserial primary key,
    course_id bigint not null references courses(id),
    module_id bigint references course_modules(id),
    title varchar(500) not null,
    description text,
    passing_score int not null default 60,
    time_limit_minutes int,
    max_attempts int not null default 1,
    is_published boolean not null default false,
    created_by bigint not null references users(id),
    updated_by bigint references users(id),
    created_at timestamp not null default now(),
    updated_at timestamp not null default now()
);