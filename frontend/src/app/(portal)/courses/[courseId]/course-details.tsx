"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/display";
import { EmptyState, ErrorBanner, LoadingState } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { ToastMessage } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import { getCourseContent, type ModuleWithLessons } from "@/lib/courses";
import { hasPermission } from "@/lib/permissions";
import type { Assessment, Course, Enrollment, PageResponse } from "@/types/api";

export function CourseDetails({ courseId }: { courseId: number }) {
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<ModuleWithLessons[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [courseData, content, assessmentData] = await Promise.all([
          apiFetch<Course>(`/api/courses/${courseId}`),
          getCourseContent(courseId),
          apiFetch<PageResponse<Assessment>>(`/api/courses/${courseId}/assessments?size=50`),
        ]);
        setCourse(courseData);
        setModules(content);
        setAssessments(assessmentData.content);
        if (hasPermission(user?.role, "course.enroll")) {
          const enrollments = await apiFetch<Enrollment[]>("/api/enrollments/me?view=all");
          setEnrolled(enrollments.some((item) => item.courseId === courseId));
        }
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Could not load this course.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [courseId, user?.role]);

  const firstLesson = useMemo(() => modules.flatMap((module) => module.lessons)[0], [modules]);
  const canManage = hasPermission(user?.role, "course.manage");
  const canEnroll = hasPermission(user?.role, "course.enroll");
  const canAttempt = hasPermission(user?.role, "assessment.attempt");

  async function enroll() {
    setBusy(true);
    setError("");
    try {
      await apiFetch(`/api/courses/${courseId}/self-enroll`, { method: "POST" });
      setEnrolled(true);
      setSuccess("Enrollment successful. You can start the course now.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not enroll in this course.");
    } finally {
      setBusy(false);
    }
  }

  async function togglePublished() {
    if (!course) return;
    setBusy(true);
    setError("");
    try {
      const updated = await apiFetch<Course>(`/api/courses/${courseId}/status?published=${!course.isPublished}`, { method: "PATCH" });
      setCourse(updated);
      setSuccess(updated.isPublished ? "Course published." : "Course moved back to draft.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not update this course.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <LoadingState label="Loading course..." />;
  if (!course) return <ErrorBanner message={error || "Course not found."} />;

  const learnerAction = enrolled ? (
    firstLesson ? <Link href={`/courses/${courseId}/lessons/${firstLesson.id}`} className="button button-primary">Continue learning</Link> : null
  ) : <Button onClick={enroll} disabled={busy}>{busy ? "Enrolling..." : "Enroll now"}</Button>;

  return (
    <div className="page-stack">
      <ToastMessage message={error} type="error" />
      <ToastMessage message={success} type="success" />
      <section className="course-hero">
        <div className="course-hero-icon"><Icon name="book" size={34} /></div>
        <div className="course-hero-copy">
          <div className="course-title-row"><h1>{course.title}</h1>{canManage ? <Badge tone={course.isPublished ? "green" : "amber"}>{course.isPublished ? "Published" : "Draft"}</Badge> : null}</div>
          <p>{course.description || "No course description has been added."}</p>
          <div className="course-meta"><Badge>{course.level}</Badge>{course.estimatedDuration ? <span><Icon name="clock" size={15} />{course.estimatedDuration} minutes</span> : null}<span>By {course.instructorName}</span></div>
        </div>
        <div className="course-hero-action">
          {canEnroll ? learnerAction : null}
          {canManage ? <Button variant="secondary" onClick={togglePublished} disabled={busy}>{course.isPublished ? "Unpublish" : "Publish"}</Button> : null}
          {canManage ? <Link href={`/instructor/courses/${courseId}/content`} className="button button-secondary">Manage content</Link> : null}
        </div>
      </section>

      <section className="course-section">
        <div className="section-heading"><div><h2>Course content</h2><p>{modules.length} modules · {modules.reduce((total, module) => total + module.lessons.length, 0)} lessons</p></div></div>
        {modules.length === 0 ? <EmptyState title="No lessons yet" message="Course content will appear here when it is ready." /> : (
          <div className="module-list">
            {modules.map((module, moduleIndex) => (
              <article className="module-card" key={module.id}>
                <div className="module-heading"><span>{moduleIndex + 1}</span><div><h3>{module.title}</h3>{module.description ? <p>{module.description}</p> : null}</div></div>
                <div className="lesson-links">
                  {module.lessons.map((lesson, lessonIndex) => (
                    <Link key={lesson.id} href={`/courses/${courseId}/lessons/${lesson.id}`} className="lesson-link">
                      <span>{lessonIndex + 1}</span><div><strong>{lesson.title}</strong><small>{lesson.contentType}{lesson.duration ? ` · ${lesson.duration} min` : ""}</small></div><Icon name="chevronRight" size={17} />
                    </Link>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {assessments.length > 0 ? (
        <section className="course-section">
          <div className="section-heading"><h2>Assessments</h2></div>
          <div className="assessment-list">
            {assessments.map((assessment) => (
              <article key={assessment.id} className="assessment-row"><div><h3>{assessment.title}</h3><p>{assessment.description || `${assessment.maxScore} points`}</p></div>{canAttempt ? <Link href={`/courses/${courseId}/assessments/${assessment.id}`} className="button button-secondary button-small">Start quiz</Link> : canManage ? <Link href={`/instructor/courses/${courseId}/content`} className="button button-secondary button-small">Manage</Link> : null}</article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
