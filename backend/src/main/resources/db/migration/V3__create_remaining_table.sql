create table if not exists enrollments(
    id bigserial primary key,
    user_id bigint not null references users(id),
    course_id bigint not null references courses(id),
    status varchar(20) default 'enrolled', -- can be 'enrolled', 'in_progress', 'completed', 'dropped'
    enrolled_at timestamp with time zone not null default now(),
    due_date timestamp with time zone,
    completed_at timestamp with time zone,
    created_by bigint not null references users(id),
    updated_by bigint references users(id),
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    constraint uq_active_enrollment unique (user_id, course_id)
);

create table if not exists assessments(
    id bigserial primary key,
    course_id bigint references courses(id) on delete cascade,
    module_id bigint references course_modules(id) on delete cascade,
    title varchar(500) not null,
    description text,
    time_limit_minutes integer,
    passing_score decimal(5,2) not null default 0,
    max_score decimal(7,2) not null default 100,
    max_attempts integer not null default 3,
    is_required boolean not null default true,
    display_order integer,
    created_by bigint not null references users(id),
    updated_by bigint references users(id),
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    constraint chk_assessment_parent check (
        (course_id is not null and module_id is null) or
        (course_id is null and module_id is not null)
    )
);

create table if not exists questions(
    id bigserial primary key,
    assessment_id bigint not null references assessments(id) on delete cascade,
    question_text text not null,
    question_type varchar(30) not null, -- can be 'single_choice', 'multiple_choice', 'short_answer'
    points decimal(5,2) not null,
    correct_answer text,
    explanation text,
    display_order integer,
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
    display_order integer,
    created_at timestamp with time zone not null default now()
);

create table if not exists attempts(
    id bigserial primary key,
    assessment_id bigint not null references assessments(id),
    user_id bigint not null references users(id),
    status varchar(20) default 'in_progress', -- can be 'in_progress', 'submitted', 'graded'
    attempt_number integer not null,
    started_at timestamp with time zone not null default now(),
    submitted_at timestamp with time zone,
    total_score decimal(7,2),
    is_passed boolean,
    questions_snapshot jsonb not null default '[]'::jsonb,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    constraint uq_attempt_number_per_assessment unique (assessment_id, user_id, attempt_number)
);

create table if not exists responses(
    id bigserial primary key,
    attempt_id bigint not null references attempts(id) on delete cascade,
    question_id bigint not null references questions(id),
    answer_text text,
    selected_option_ids jsonb default '[]'::jsonb,
    is_correct boolean,
    score decimal(5,2),
    answered_at timestamp with time zone not null default now(),
    constraint uq_response_per_question_per_attempt unique (attempt_id, question_id)
);

create table if not exists grades(
    id bigserial primary key,
    response_id bigint not null references responses(id) on delete cascade,
    grader_id bigint not null references users(id),
    score decimal(5,2) not null,
    feedback text,
    created_by bigint not null references users(id),
    updated_by bigint references users(id),
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now()
);

create table if not exists grade_corrections(
    id bigserial primary key,
    grade_id bigint not null references grades(id) on delete cascade,
    previous_score decimal(5,2) not null,
    new_score decimal(5,2) not null,
    corrected_by bigint not null references users(id),
    reason text not null,
    corrected_at timestamp with time zone not null default now(),
    created_at timestamp with time zone not null default now()
);

create table if not exists lesson_progress(
    id bigserial primary key,
    user_id bigint not null references users(id),
    lesson_id bigint not null references lessons(id) on delete cascade,
    is_completed boolean not null default false,
    completed_at timestamp with time zone,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    constraint uq_lesson_progress_per_user unique (user_id, lesson_id)
);

create table if not exists notifications(
    id bigserial primary key,
    user_id bigint not null references users(id),
    title varchar(500) not null,
    message text not null,
    type varchar(50) not null, -- can be 'enrollment', 'assessment', 'grade', 'reminder', 'system'
    is_read boolean not null default false,
    reference_type varchar(50),
    reference_id bigint,
    created_at timestamp with time zone not null default now()
);

create table if not exists activity_history(
    id bigserial primary key,
    user_id bigint references users(id),
    action varchar(100) not null,
    entity_type varchar(100),
    entity_id bigint,
    old_value jsonb,
    new_value jsonb,
    created_at timestamp with time zone not null default now()
);
