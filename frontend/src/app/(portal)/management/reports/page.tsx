"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageTitle, StatCard } from "@/components/ui/display";
import { LoadingState } from "@/components/ui/feedback";
import { ToastMessage } from "@/components/ui/toast";
import { Field, Input, Select } from "@/components/ui/form-field";
import { apiFetch, queryString } from "@/lib/api";
import type { Course, CourseReport, PageResponse } from "@/types/api";

export default function ReportsPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState("");
  const [status, setStatus] = useState("");
  const [learnerId, setLearnerId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [report, setReport] = useState<CourseReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<PageResponse<Course>>("/api/courses?size=100&sort=title,asc")
      .then((data) => { setCourses(data.content); if (data.content[0]) setCourseId(String(data.content[0].id)); })
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Could not load courses."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!courseId) return;
    apiFetch<CourseReport>(`/api/reports/courses/${courseId}/summary`).then(setReport).catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Could not load report."));
  }, [courseId]);

  async function download(kind: "enrollments" | "results") {
    setError("");
    try {
      const query = queryString({ courseId, status, learnerId, from, to });
      const csv = await apiFetch<string>(`/api/reports/${kind}/export${query}`);
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
      const link = document.createElement("a"); link.href = url; link.download = `${kind}.csv`; link.click(); URL.revokeObjectURL(url);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Could not export report."); }
  }

  if (loading) return <LoadingState />;
  return (
    <div className="page-stack">
      <PageTitle title="Reports" description="Track course performance and export backend-generated CSV reports." />
      <ToastMessage message={error} type="error" />
      <div className="report-filters"><Field label="Course"><Select value={courseId} onChange={(event) => setCourseId(event.target.value)}>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</Select></Field><Field label="Status"><Select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="completed">Completed</option><option value="rejected">Rejected</option></Select></Field><Field label="Learner ID"><Input type="number" min="1" value={learnerId} onChange={(event) => setLearnerId(event.target.value)} /></Field><Field label="From"><Input type="datetime-local" value={from} onChange={(event) => setFrom(event.target.value)} /></Field><Field label="To"><Input type="datetime-local" value={to} onChange={(event) => setTo(event.target.value)} /></Field></div>
      {report ? <section className="stats-grid report-stats"><StatCard label="Enrolled" value={report.enrolledTotal} icon="user" tone="blue" /><StatCard label="Completed" value={report.completed} icon="check" tone="green" /><StatCard label="Pending" value={report.pending} icon="clock" tone="amber" /><div className="report-metric"><span>Average score</span><strong>{Number(report.avgScore ?? 0).toFixed(1)}</strong></div><div className="report-metric"><span>Pass rate</span><strong>{Number(report.passRate ?? 0).toFixed(1)}%</strong></div><div className="report-metric"><span>Overdue</span><strong>{report.overdue}</strong></div></section> : null}
      <div className="export-actions"><Button onClick={() => download("enrollments")} disabled={!courseId}>Export enrollments</Button><Button variant="secondary" onClick={() => download("results")} disabled={!courseId}>Export results</Button></div>
    </div>
  );
}
