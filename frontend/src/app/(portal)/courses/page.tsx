"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { CourseCard } from "@/components/course/course-card";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/display";
import { EmptyState, LoadingState } from "@/components/ui/feedback";
import { Input, Select } from "@/components/ui/form-field";
import { Icon } from "@/components/ui/icon";
import { ToastMessage } from "@/components/ui/toast";
import { apiFetch, queryString } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import type { Course, Enrollment, PageResponse } from "@/types/api";

export default function CourseCatalogPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<number>>(new Set());
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyCourseId, setBusyCourseId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;
    async function loadCourses() {
      try {
        const query = queryString({ title: search, level, published: true, archived: false, size: 24 });
        const result = await apiFetch<PageResponse<Course>>(`/api/courses/search${query}`);
        if (!active) return;
        setCourses(result.content);
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
  }, [level, search, user]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSearch(searchInput.trim());
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
        <Select value={level} onChange={(event) => { setLoading(true); setError(""); setLevel(event.target.value); }} aria-label="Filter by level">
          <option value="">All levels</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option>
        </Select>
        <Button type="submit">Search</Button>
      </form>
      <ToastMessage message={error} type="error" />
      <ToastMessage message={success} type="success" />
      {loading ? <LoadingState label="Loading catalog..." /> : courses.length === 0 ? (
        <EmptyState title="No courses found" message="Try another search or level." />
      ) : (
        <div className="course-grid">
          {courses.map((course) => {
            const enrolled = enrolledCourseIds.has(course.id);
            const selfEnrollmentAllowed = course.enrollmentMode === "self_enroll" || course.enrollmentMode === "open";
            return <CourseCard key={course.id} course={course} action={hasPermission(user?.role, "course.enroll") ? (
              enrolled ? <Link href={`/courses/${course.id}`} className="button button-secondary button-full">Open course</Link> : selfEnrollmentAllowed ? <Button fullWidth disabled={busyCourseId === course.id} onClick={() => enroll(course.id)}>{busyCourseId === course.id ? "Enrolling..." : "Enroll"}</Button> : <Button fullWidth variant="secondary" disabled>Manager assignment required</Button>
            ) : <Link href={`/courses/${course.id}`} className="button button-secondary button-full">View course</Link>} />;
          })}
        </div>
      )}
    </div>
  );
}
