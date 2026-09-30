Create table if not exists courses(
    id Bigserial primary key,
    title varchar(500) not null,
    description text,
    instructor_id bigint not null references users(id) on delete restrict,
    is_published boolean not null default false,
    estimated_duration integer,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    created_by bigint not null references users(id),
    updated_by bigint references users(id)
);

create table if not exists course_modules(
    id bigserial primary key,
    course_id bigint not null references courses(id) on delete cascade,
    title varchar(500) not null,
    description text,
    display_order integer not null,
    is_required boolean not null default true,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    created_by bigint not null references users(id),
    updated_by bigint references users(id)
);

create table if not exists lessons(
    id bigserial primary key,
    module_id bigint not null references course_modules(id) on delete cascade,
    title varchar(500) not null,
    content_type varchar(50) default 'text', -- can be 'text', 'video', 'quiz', etc.
    content_url varchar(1000),
    content_body text,
    display_order integer not null,
    is_required boolean not null default true,
    duration integer,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    created_by bigint not null references users(id),
    updated_by bigint references users(id)
);