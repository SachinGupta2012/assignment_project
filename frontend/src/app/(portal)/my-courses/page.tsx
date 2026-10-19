"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { RoleGuard } from "@/components/auth/role-guard";
import { PageTitle, ProgressBar } from "@/components/ui/display";
import { EmptyState, LoadingState } from "@/components/ui/feedback";
import { ToastMessage } from "@/components/ui/toast";
import { apiFetch, queryString } from "@/lib/api";
import type { Course, Enrollment, PageResponse, Progress } from "@/types/api";

interface MyCourseItem { course: Course; progress: number; }

export default function MyCoursesPage() {
  return <RoleGuard permission="myCourses.read"><MyCoursesContent /></RoleGuard>;
}

function MyCoursesContent() {
  const { user } = useAuth();
  const [items, setItems] = useState<MyCourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;

    async function load() {
      setLoading(true);
      try {
        if (user!.role === "LEARNER") {
          const enrollments = await apiFetch<Enrollment[]>("/api/enrollments/me?view=all");
          const data = await Promise.all(enrollments.map(async ({ courseId }) => {
            const [course, progress] = await Promise.all([
              apiFetch<Course>(`/api/courses/${courseId}`),
              apiFetch<Progress>(`/api/courses/${courseId}/progress`).catch(() => null),
            ]);
            return { course, progress: progress?.percentage ?? 0 };
          }));
          setItems(data);
        } else {
          const query = queryString({ instructorId: user!.role === "INSTRUCTOR" ? user!.id : undefined, size: 50 });
          const data = await apiFetch<PageResponse<Course>>(`/api/courses/search${query}`);
          setItems(data.content.map((course) => ({ course, progress: 0 })));
        }
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Could not load your courses.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [user]);

  return (
    <div className="page-stack">
      <PageTitle title="My courses" description={user?.role === "LEARNER" ? "Continue where you left off." : "Courses you can manage."} />
      <ToastMessage message={error} type="error" />
      {loading ? <LoadingState label="Loading your courses..." /> : items.length === 0 ? <EmptyState title="Nothing here yet" message="Your courses will appear here." /> : (
        <div className="learning-list">
          {items.map(({ course, progress }) => (
            <article className="learning-row" key={course.id}>
              <div className="learning-thumbnail">{course.title.charAt(0)}</div>
              <div className="learning-copy"><h3>{course.title}</h3><span>{course.level} · {course.instructorName}</span></div>
              {user?.role === "LEARNER" ? <div className="learning-progress"><ProgressBar value={progress} /><span>{progress}%</span></div> : <span className="muted-text">{course.isPublished ? "Published" : "Draft"}</span>}
              <Link href={`/courses/${course.id}`} className="button button-primary button-small">Open</Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
