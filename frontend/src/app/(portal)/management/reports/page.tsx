"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/display";
import { EmptyState, LoadingState } from "@/components/ui/feedback";
import { Field, Input, Select } from "@/components/ui/form-field";
import { Pagination } from "@/components/ui/pagination";
import { ToastMessage } from "@/components/ui/toast";
import { apiFetch, queryString } from "@/lib/api";
import type { Course, CourseReport, PageResponse } from "@/types/api";

interface ReportFilters {
  courseId: string;
  status: string;
  learnerId: string;
  from: string;
  to: string;
}

interface PerformanceRow {
  course: Course;
  report: CourseReport;
}

const emptyFilters: ReportFilters = { courseId: "", status: "", learnerId: "", from: "", to: "" };
const PAGE_SIZE = 8;

export default function ReportsPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [rows, setRows] = useState<PerformanceRow[]>([]);
  const [draftFilters, setDraftFilters] = useState<ReportFilters>(emptyFilters);
  const [filters, setFilters] = useState<ReportFilters>(emptyFilters);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    apiFetch<PageResponse<Course>>("/api/courses?size=100&sort=title,asc")
      .then(async (data) => {
        const summaries = await Promise.all(data.content.map(async (course) => ({
          course,
          report: await apiFetch<CourseReport>(`/api/reports/courses/${course.id}/summary`),
        })));
        if (!active) return;
        setCourses(data.content);
        setRows(summaries);
      })
      .catch((requestError) => {
        if (active) setError(requestError instanceof Error ? requestError.message : "Could not load reports.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filteredRows = useMemo(() => filters.courseId
    ? rows.filter((row) => String(row.course.id) === filters.courseId)
    : rows, [filters.courseId, rows]);
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleRows = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setFilters({ ...draftFilters });
  }

  function resetFilters() {
    setDraftFilters({ ...emptyFilters });
    setFilters({ ...emptyFilters });
    setPage(1);
  }

  async function download(kind: "enrollments" | "results") {
    setError("");
    try {
      const query = queryString(filters);
      const csv = await apiFetch<string>(`/api/reports/${kind}/export${query}`);
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `${kind}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not export report.");
    }
  }

  if (loading) return <LoadingState label="Loading course performance..." />;

  return (
    <div className="page-stack reports-page">
      <PageTitle title="Reports" description="Track course performance and export backend-generated CSV reports." />
      <ToastMessage message={error} type="error" />

      <form className="report-filters" onSubmit={applyFilters}>
        <Field label="Course"><Select value={draftFilters.courseId} onChange={(event) => setDraftFilters((current) => ({ ...current, courseId: event.target.value }))}><option value="">All courses</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</Select></Field>
        <Field label="Status"><Select value={draftFilters.status} onChange={(event) => setDraftFilters((current) => ({ ...current, status: event.target.value }))}><option value="">All statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="completed">Completed</option><option value="rejected">Rejected</option></Select></Field>
        <Field label="Learner ID"><Input type="number" min="1" value={draftFilters.learnerId} onChange={(event) => setDraftFilters((current) => ({ ...current, learnerId: event.target.value }))} placeholder="Enter learner ID" /></Field>
        <Field label="From date"><Input type="datetime-local" value={draftFilters.from} onChange={(event) => setDraftFilters((current) => ({ ...current, from: event.target.value }))} /></Field>
        <Field label="To date"><Input type="datetime-local" value={draftFilters.to} onChange={(event) => setDraftFilters((current) => ({ ...current, to: event.target.value }))} /></Field>
        <div className="report-filter-actions"><Button type="submit">Apply</Button><Button type="button" variant="secondary" onClick={resetFilters}>Reset</Button></div>
      </form>

      <section className="report-table-panel">
        <div className="report-table-header">
          <div><h2>Course performance</h2><p>Enrollment and assessment statistics by course.</p></div>
          <div className="export-actions">
            <Button variant="secondary" onClick={() => download("enrollments")}>Export enrollments</Button>
            <Button onClick={() => download("results")} disabled={!filters.courseId} title={!filters.courseId ? "Select a course and apply the filter to export results." : undefined}>Export results</Button>
          </div>
        </div>

        {visibleRows.length === 0 ? <EmptyState title="No course reports" message="No courses match the selected filter." /> : (
          <div className="table-wrap">
            <table className="data-table report-table">
              <thead><tr><th>Course</th><th>Enrolled</th><th>Completed</th><th>Pending</th><th>Average score</th><th>Pass rate</th><th>Overdue</th><th>Actions</th></tr></thead>
              <tbody>{visibleRows.map(({ course, report }) => <tr key={course.id}>
                <td><strong>{course.title}</strong><p>{course.isPublished ? "Published" : "Draft"}</p></td>
                <td>{report.enrolledTotal}</td>
                <td>{report.completed}</td>
                <td>{report.pending}</td>
                <td>{Number(report.avgScore ?? 0).toFixed(1)}</td>
                <td>{Number(report.passRate ?? 0).toFixed(1)}%</td>
                <td>{report.overdue}</td>
                <td><Link href={`/courses/${course.id}`} className="button button-secondary button-small">View</Link></td>
              </tr>)}</tbody>
            </table>
          </div>
        )}
        {filteredRows.length > 0 ? <div className="report-table-footer"><span>Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredRows.length)} of {filteredRows.length} courses</span><Pagination page={currentPage} totalPages={pageCount} onPageChange={setPage} /></div> : null}
      </section>
    </div>
  );
}
