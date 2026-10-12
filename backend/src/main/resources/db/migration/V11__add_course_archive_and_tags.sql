alter table courses add column is_archived boolean not null default false;
alter table courses add column tags varchar(500);
