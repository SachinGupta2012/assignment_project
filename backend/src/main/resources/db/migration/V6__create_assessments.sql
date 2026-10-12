create table if not exists assessments(
    id bigserial primary key,
    course_id bigint references courses(id) on delete cascade,
    module_id bigint references course_modules(id) on delete cascade,
    title varchar(500) not null,
    description text,
    time_limit_minutes int,
    passing_score numeric not null default 0,
    max_score numeric not null default 100,
    max_attempts int not null default 3,
    is_required boolean not null default true,
    display_order int,
    created_by bigint not null references users(id),
    updated_by bigint references users(id),
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now()
);