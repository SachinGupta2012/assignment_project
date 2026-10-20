"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { RoleGuard } from "@/components/auth/role-guard";
import { Badge, PageTitle, ProgressBar } from "@/components/ui/display";
import { EmptyState, LoadingState } from "@/components/ui/feedback";
import { Pagination } from "@/components/ui/pagination";
import { ToastMessage } from "@/components/ui/toast";
import { apiFetch, queryString } from "@/lib/api";
import type { Course, Enrollment, PageResponse, Progress } from "@/types/api";

interface MyCourseItem { course: Course; progress: number; }
const PAGE_SIZE = 10;

export default function MyCoursesPage() {
  return <RoleGuard permission="myCourses.read"><MyCoursesContent /></RoleGuard>;
}

function MyCoursesContent() {
  const { user } = useAuth();
  const [items, setItems] = useState<MyCourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;

    async function load() {
      setLoading(true);
      try {
        if (user!.role === "LEARNER") {
          const enrollments = await apiFetch<Enrollment[]>("/api/enrollments/me?view=all");
          const accessibleEnrollments = enrollments.filter((enrollment) => enrollment.status === "approved" || enrollment.status === "completed");
          const data = await Promise.all(accessibleEnrollments.map(async ({ courseId }) => {
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

  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleItems = items.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="page-stack">
      <PageTitle title="My courses" description={user?.role === "LEARNER" ? "Continue where you left off." : "Courses you can manage."} />
      <ToastMessage message={error} type="error" />
      {loading ? <LoadingState label="Loading your courses..." /> : items.length === 0 ? <EmptyState title="Nothing here yet" message="Your courses will appear here." /> : (
        <div className="table-stack">
          <div className="table-wrap"><table className="data-table course-table">
            <thead><tr><th>Course</th><th>Instructor</th><th>Level</th><th>{user?.role === "LEARNER" ? "Progress" : "Status"}</th><th>Action</th></tr></thead>
            <tbody>{visibleItems.map(({ course, progress }) => <tr key={course.id}>
              <td><strong>{course.title}</strong><p>{course.description || "No description"}</p></td>
              <td>{course.instructorName}</td>
              <td><Badge>{course.level}</Badge></td>
              <td>{user?.role === "LEARNER" ? <div className="table-progress"><ProgressBar value={progress} /><span>{progress}%</span></div> : <Badge tone={course.isArchived ? "neutral" : course.isPublished ? "green" : "amber"}>{course.isArchived ? "Archived" : course.isPublished ? "Published" : "Draft"}</Badge>}</td>
              <td><Link href={`/courses/${course.id}`} className="button button-primary button-small">Open</Link></td>
            </tr>)}</tbody>
          </table></div>
          <Pagination page={currentPage} totalPages={pageCount} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
