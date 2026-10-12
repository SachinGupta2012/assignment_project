create table if not exists notifications(
    id bigserial primary key,
    user_id bigint not null references users(id) on delete cascade,
    type varchar(50) not null,
    title varchar(500) not null,
    message text,
    is_read boolean not null default false,
    created_at timestamp with time zone not null default now()
);
