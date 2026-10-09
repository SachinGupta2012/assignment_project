create table if not exists enrollments(
    id bigserial primary key,
    course_id bigint not null references courses(id),
    user_id bigint not null references users(id),
    status varchar(20) not null default 'pending',
    due_date timestamp,
    enrolled_at timestamp not null default now(),
    completed_at timestamp,
    created_by bigint not null references users(id),
    updated_by bigint references users(id),
    created_at timestamp not null default now(),
    updated_at timestamp not null default now(),
    constraint unique_enrollment unique(course_id, user_id)

);