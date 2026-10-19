"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { PermissionGate } from "@/components/auth/role-guard";
import { ErrorBanner, LoadingState } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { ToastMessage } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import { getCourseContent, type ModuleWithLessons } from "@/lib/courses";
import type { Assessment, Course, Lesson, PageResponse } from "@/types/api";

export function LessonView({ courseId, lessonId }: { courseId: number; lessonId: number }) {
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<ModuleWithLessons[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      apiFetch<Course>(`/api/courses/${courseId}`),
      getCourseContent(courseId),
      apiFetch<PageResponse<Assessment>>(`/api/courses/${courseId}/assessments?size=50`),
    ])
      .then(([courseData, content, assessmentData]) => {
        setCourse(courseData);
        setModules(content);
        setAssessments(assessmentData.content);
      })
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Could not load this lesson."))
      .finally(() => setLoading(false));
  }, [courseId]);

  const lessons = useMemo(() => modules.flatMap((module) => module.lessons), [modules]);
  const lesson = lessons.find((item) => item.id === lessonId) ?? null;
  const learningItems = useMemo(() => {
    const items = modules.flatMap((module) => [
      ...module.lessons.map((item) => ({ type: "lesson" as const, id: item.id })),
      ...assessments
        .filter((assessment) => assessment.moduleId === module.id)
        .sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id)
        .map((assessment) => ({ type: "assessment" as const, id: assessment.id })),
    ]);

    return [
      ...items,
      ...assessments
        .filter((assessment) => assessment.moduleId === null)
        .sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id)
        .map((assessment) => ({ type: "assessment" as const, id: assessment.id })),
    ];
  }, [assessments, modules]);
  const currentIndex = learningItems.findIndex((item) => item.type === "lesson" && item.id === lessonId);
  const nextItem = currentIndex >= 0 ? learningItems[currentIndex + 1] : undefined;

  async function markComplete() {
    setCompleting(true);
    setError("");
    try {
      await apiFetch(`/api/lessons/${lessonId}/complete`, { method: "POST" });
      setCompleted(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not mark this lesson complete.");
    } finally {
      setCompleting(false);
    }
  }

  if (loading) return <LoadingState label="Loading lesson..." />;
  if (!lesson || !course) return <ErrorBanner message={error || "Lesson not found."} />;

  return (
    <div className="lesson-page">
      <aside className="lesson-sidebar">
        <Link href={`/courses/${courseId}`} className="back-link"><Icon name="chevronLeft" size={16} />Back to course</Link>
        <h2>{course.title}</h2>
        {modules.map((module) => (
          <LessonModule
            key={module.id}
            module={module}
            assessments={assessments.filter((assessment) => assessment.moduleId === module.id)}
            courseId={courseId}
            activeLessonId={lessonId}
          />
        ))}
        <AssessmentLinks
          title="Course assessments"
          assessments={assessments.filter((assessment) => assessment.moduleId === null)}
          courseId={courseId}
        />
      </aside>
      <section className="lesson-content">
        <ToastMessage message={error} type="error" />
        <ToastMessage message={completed ? "Lesson completed. Your progress has been updated." : ""} type="success" />
        <div className="lesson-heading"><div><span>{lesson.contentType}</span><h1>{lesson.title}</h1></div>{lesson.duration ? <span><Icon name="clock" size={15} />{lesson.duration} min</span> : null}</div>
        <LessonBody lesson={lesson} />
        <div className="lesson-actions">
          <PermissionGate permission="lesson.complete"><Button variant="secondary" onClick={markComplete} disabled={completing || completed}><Icon name="check" size={17} />{completed ? "Completed" : completing ? "Saving..." : "Mark as complete"}</Button></PermissionGate>
          {nextItem ? <Link href={nextItem.type === "lesson" ? `/courses/${courseId}/lessons/${nextItem.id}` : `/courses/${courseId}/assessments/${nextItem.id}`} className="button button-primary">{nextItem.type === "lesson" ? "Next lesson" : "Next quiz"}<Icon name="chevronRight" size={17} /></Link> : <Link href={`/courses/${courseId}`} className="button button-primary">Back to course</Link>}
        </div>
      </section>
    </div>
  );
}

function LessonModule({ module, assessments, courseId, activeLessonId }: { module: ModuleWithLessons; assessments: Assessment[]; courseId: number; activeLessonId: number }) {
  return (
    <div className="lesson-module"><h3>{module.title}</h3>{module.lessons.map((lesson, index) => <Link key={lesson.id} href={`/courses/${courseId}/lessons/${lesson.id}`} className={lesson.id === activeLessonId ? "active" : ""}><span>{index + 1}</span>{lesson.title}</Link>)}<AssessmentLinks assessments={assessments} courseId={courseId} /></div>
  );
}

function AssessmentLinks({ title, assessments, courseId }: { title?: string; assessments: Assessment[]; courseId: number }) {
  if (assessments.length === 0) return null;

  return (
    <div className={title ? "lesson-module" : "lesson-assessments"}>
      {title ? <h3>{title}</h3> : null}
      {[...assessments]
        .sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id)
        .map((assessment) => <Link key={assessment.id} href={`/courses/${courseId}/assessments/${assessment.id}`} className="assessment-link"><span>Q</span>{assessment.title}</Link>)}
    </div>
  );
}

function LessonBody({ lesson }: { lesson: Lesson }) {
  if ((lesson.contentType === "video" || lesson.contentType === "link" || lesson.contentType === "file") && lesson.contentUrl) {
    return <div className="lesson-resource"><Icon name="book" size={30} /><h2>Lesson resource</h2><p>Open the attached resource to continue this lesson.</p><a className="button button-primary" href={lesson.contentUrl} target="_blank" rel="noreferrer">Open resource</a></div>;
  }
  return <div className="lesson-body">{lesson.contentBody ? <p>{lesson.contentBody}</p> : <p>No lesson content has been added yet.</p>}</div>;
}
