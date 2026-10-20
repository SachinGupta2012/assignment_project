"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { RoleGuard } from "@/components/auth/role-guard";
import { Badge, PageTitle, ProgressBar } from "@/components/ui/display";
import { EmptyState, LoadingState } from "@/components/ui/feedback";
import { Input, Select } from "@/components/ui/form-field";
import { Icon } from "@/components/ui/icon";
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
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("");
  const [status, setStatus] = useState("");
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

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter(({ course, progress }) => {
      const matchesSearch = !term || [course.title, course.description, course.instructorName, course.tags]
        .some((value) => value?.toLowerCase().includes(term));
      const matchesLevel = !level || course.level.toLowerCase() === level;
      const matchesStatus = !status || (user?.role === "LEARNER"
        ? status === "not_started" ? progress === 0
          : status === "in_progress" ? progress > 0 && progress < 100
            : progress === 100
        : status === "archived" ? course.isArchived
          : status === "published" ? course.isPublished && !course.isArchived
            : !course.isPublished && !course.isArchived);
      return matchesSearch && matchesLevel && matchesStatus;
    });
  }, [items, level, search, status, user?.role]);

  const pageCount = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleItems = filteredItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function updateFilter(setter: (value: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  return (
    <div className="page-stack">
      <PageTitle title="My courses" description={user?.role === "LEARNER" ? "Continue where you left off." : "Courses you can manage."} />
      <div className="catalog-filters">
        <div className="search-input"><Icon name="search" size={17} /><Input value={search} onChange={(event) => updateFilter(setSearch, event.target.value)} placeholder="Search by course, instructor, or tag" aria-label="Search my courses" /></div>
        <Select value={level} onChange={(event) => updateFilter(setLevel, event.target.value)} aria-label="Filter by level"><option value="">All levels</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></Select>
        <Select value={status} onChange={(event) => updateFilter(setStatus, event.target.value)} aria-label={user?.role === "LEARNER" ? "Filter by progress" : "Filter by status"}>
          <option value="">{user?.role === "LEARNER" ? "All progress" : "All statuses"}</option>
          {user?.role === "LEARNER" ? <><option value="not_started">Not started</option><option value="in_progress">In progress</option><option value="completed">Completed</option></> : <><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></>}
        </Select>
      </div>
      <ToastMessage message={error} type="error" />
      {loading ? <LoadingState label="Loading your courses..." /> : items.length === 0 ? <EmptyState title="Nothing here yet" message="Your courses will appear here." /> : filteredItems.length === 0 ? <EmptyState title="No courses found" message="Change the search or filters and try again." /> : (
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
