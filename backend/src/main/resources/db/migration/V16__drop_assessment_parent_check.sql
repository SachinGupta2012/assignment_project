-- The original V6 required exactly one of course_id / module_id
-- (chk_assessment_parent). The working semantic is: course is always set,
-- module is optional (course-level vs module-level quiz). Drop the check.
alter table assessments drop constraint if exists chk_assessment_parent;
