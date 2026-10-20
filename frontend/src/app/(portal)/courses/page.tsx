"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { CourseCard } from "@/components/course/course-card";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/display";
import { EmptyState, LoadingState } from "@/components/ui/feedback";
import { Input, Select } from "@/components/ui/form-field";
import { Icon } from "@/components/ui/icon";
import { Pagination } from "@/components/ui/pagination";
import { ToastMessage } from "@/components/ui/toast";
import { apiFetch, queryString } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import type { Course, Enrollment, PageResponse } from "@/types/api";

const PAGE_SIZE = 10;

export default function CourseCatalogPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<number>>(new Set());
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busyCourseId, setBusyCourseId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;
    async function loadCourses() {
      try {
        const query = queryString({ title: search, level, published: true, archived: false, page, size: PAGE_SIZE, sort: "title,asc" });
        const result = await apiFetch<PageResponse<Course>>(`/api/courses/search${query}`);
        if (!active) return;
        setCourses(result.content);
        setTotalPages(Math.max(1, result.totalPages));
        if (hasPermission(user?.role, "course.enroll")) {
          const enrollments = await apiFetch<Enrollment[]>("/api/enrollments/me?view=all");
          if (!active) return;
          setEnrolledCourseIds(new Set(enrollments
            .filter((enrollment) => enrollment.status === "approved" || enrollment.status === "completed")
            .map((enrollment) => enrollment.courseId)));
        }
      } catch (requestError) {
        if (active) setError(requestError instanceof Error ? requestError.message : "Could not load courses.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadCourses();
    return () => { active = false; };
  }, [level, page, search, user?.role]);

  useEffect(() => {
    const nextSearch = searchInput.trim();
    if (nextSearch === search) return;
    const timeoutId = window.setTimeout(() => {
      setLoading(true);
      setError("");
      setPage(0);
      setSearch(nextSearch);
    }, 400);
    return () => window.clearTimeout(timeoutId);
  }, [search, searchInput]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextSearch = searchInput.trim();
    if (nextSearch === search) return;
    setLoading(true);
    setError("");
    setPage(0);
    setSearch(nextSearch);
  }

  function changeLevel(value: string) {
    setLoading(true);
    setError("");
    setPage(0);
    setLevel(value);
  }

  function changePage(nextPage: number) {
    setLoading(true);
    setError("");
    setPage(nextPage - 1);
  }

  async function enroll(courseId: number) {
    setBusyCourseId(courseId);
    setError("");
    setSuccess("");
    try {
      await apiFetch(`/api/courses/${courseId}/self-enroll`, { method: "POST" });
      setEnrolledCourseIds((current) => new Set(current).add(courseId));
      setSuccess("You are enrolled. The course is now available in My Courses.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not enroll in this course.");
    } finally {
      setBusyCourseId(null);
    }
  }

  return (
    <div className="page-stack">
      <PageTitle title="Course catalog" description="Find the right course and start learning." />
      <form className="catalog-filters" onSubmit={handleSearch}>
        <div className="search-input"><Icon name="search" size={17} /><Input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search courses..." aria-label="Search courses" /></div>
        <Select value={level} onChange={(event) => changeLevel(event.target.value)} aria-label="Filter by level"><option value="">All levels</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></Select>
        <Button type="submit">Search</Button>
      </form>
      <ToastMessage message={error} type="error" />
      <ToastMessage message={success} type="success" />
      {loading ? <LoadingState label="Loading catalog..." /> : courses.length === 0 ? <EmptyState title="No courses found" message="Try another search or level." /> : (
        <div className="table-stack">
          <div className="course-grid">{courses.map((course) => {
              const enrolled = enrolledCourseIds.has(course.id);
              const selfEnrollmentAllowed = course.enrollmentMode === "self_enroll" || course.enrollmentMode === "open";
              return <CourseCard key={course.id} course={course} action={hasPermission(user?.role, "course.enroll") ? (
                enrolled ? <Link href={`/courses/${course.id}`} className="button button-secondary button-full">Open course</Link> : selfEnrollmentAllowed ? <Button fullWidth disabled={busyCourseId === course.id} onClick={() => enroll(course.id)}>{busyCourseId === course.id ? "Enrolling..." : "Enroll"}</Button> : <Button fullWidth variant="secondary" disabled>Manager assignment required</Button>
              ) : <Link href={`/courses/${course.id}`} className="button button-secondary button-full">View course</Link>} />;
            })}</div>
          <Pagination page={page + 1} totalPages={totalPages} disabled={loading} onPageChange={changePage} />
        </div>
      )}
    </div>
  );
}
