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
import type { Course, Lesson } from "@/types/api";

export function LessonView({ courseId, lessonId }: { courseId: number; lessonId: number }) {
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<ModuleWithLessons[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([apiFetch<Course>(`/api/courses/${courseId}`), getCourseContent(courseId)])
      .then(([courseData, content]) => { setCourse(courseData); setModules(content); })
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Could not load this lesson."))
      .finally(() => setLoading(false));
  }, [courseId]);

  const lessons = useMemo(() => modules.flatMap((module) => module.lessons), [modules]);
  const lesson = lessons.find((item) => item.id === lessonId) ?? null;
  const currentIndex = lessons.findIndex((item) => item.id === lessonId);
  const nextLesson = currentIndex >= 0 ? lessons[currentIndex + 1] : undefined;

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
        {modules.map((module) => <LessonModule key={module.id} module={module} courseId={courseId} activeLessonId={lessonId} />)}
      </aside>
      <section className="lesson-content">
        <ToastMessage message={error} type="error" />
        <ToastMessage message={completed ? "Lesson completed. Your progress has been updated." : ""} type="success" />
        <div className="lesson-heading"><div><span>{lesson.contentType}</span><h1>{lesson.title}</h1></div>{lesson.duration ? <span><Icon name="clock" size={15} />{lesson.duration} min</span> : null}</div>
        <LessonBody lesson={lesson} />
        <div className="lesson-actions">
          <PermissionGate permission="lesson.complete"><Button variant="secondary" onClick={markComplete} disabled={completing || completed}><Icon name="check" size={17} />{completed ? "Completed" : completing ? "Saving..." : "Mark as complete"}</Button></PermissionGate>
          {nextLesson ? <Link href={`/courses/${courseId}/lessons/${nextLesson.id}`} className="button button-primary">Next lesson<Icon name="chevronRight" size={17} /></Link> : <Link href={`/courses/${courseId}`} className="button button-primary">Back to course</Link>}
        </div>
      </section>
    </div>
  );
}

function LessonModule({ module, courseId, activeLessonId }: { module: ModuleWithLessons; courseId: number; activeLessonId: number }) {
  return (
    <div className="lesson-module"><h3>{module.title}</h3>{module.lessons.map((lesson, index) => <Link key={lesson.id} href={`/courses/${courseId}/lessons/${lesson.id}`} className={lesson.id === activeLessonId ? "active" : ""}><span>{index + 1}</span>{lesson.title}</Link>)}</div>
  );
}

function LessonBody({ lesson }: { lesson: Lesson }) {
  if ((lesson.contentType === "video" || lesson.contentType === "link" || lesson.contentType === "file") && lesson.contentUrl) {
    return <div className="lesson-resource"><Icon name="book" size={30} /><h2>Lesson resource</h2><p>Open the attached resource to continue this lesson.</p><a className="button button-primary" href={lesson.contentUrl} target="_blank" rel="noreferrer">Open resource</a></div>;
  }
  return <div className="lesson-body">{lesson.contentBody ? <p>{lesson.contentBody}</p> : <p>No lesson content has been added yet.</p>}</div>;
}
