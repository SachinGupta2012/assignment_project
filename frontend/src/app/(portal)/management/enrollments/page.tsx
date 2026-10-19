"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge, PageTitle, StatCard } from "@/components/ui/display";
import { EmptyState, LoadingState } from "@/components/ui/feedback";
import { Field, Input, Select } from "@/components/ui/form-field";
import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ToastMessage } from "@/components/ui/toast";
import { apiFetch, queryString } from "@/lib/api";
import type { Course, Enrollment, PageResponse, User } from "@/types/api";

const PAGE_SIZE = 10;

export default function EnrollmentManagementPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [learners, setLearners] = useState<User[]>([]);
  const [courseId, setCourseId] = useState("");
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dueFilter, setDueFilter] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [learnerId, setLearnerId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      apiFetch<PageResponse<Course>>("/api/courses?size=100&sort=title,asc"),
      apiFetch<User[]>("/api/users/learners"),
    ])
      .then(([coursePage, learnerData]) => {
        if (!active) return;
        const publishedCourses = coursePage.content.filter((course) => course.isPublished && !course.isArchived);
        setCourses(publishedCourses);
        setLearners(learnerData);
        if (publishedCourses[0]) setCourseId(String(publishedCourses[0].id));
        else setEnrollmentsLoading(false);
      })
      .catch((requestError) => {
        if (active) setError(requestError instanceof Error ? requestError.message : "Could not load enrollment data.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!courseId) return;
    let active = true;
    apiFetch<PageResponse<Enrollment>>(`/api/courses/${courseId}/enrollments?size=100`)
      .then((data) => { if (active) setEnrollments(data.content); })
      .catch((requestError) => {
        if (active) setError(requestError instanceof Error ? requestError.message : "Could not load enrollments.");
      })
      .finally(() => { if (active) setEnrollmentsLoading(false); });
    return () => { active = false; };
  }, [courseId]);

  const selectedCourse = courses.find((course) => String(course.id) === courseId);
  const filteredEnrollments = useMemo(() => enrollments.filter((enrollment) => {
    const matchesSearch = `${enrollment.learnerName} ${enrollment.learnerId}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || enrollment.status === statusFilter;
    const overdue = isOverdue(enrollment);
    const matchesDue = !dueFilter
      || (dueFilter === "overdue" && overdue)
      || (dueFilter === "upcoming" && enrollment.dueDate !== null && !overdue)
      || (dueFilter === "none" && enrollment.dueDate === null);
    return matchesSearch && matchesStatus && matchesDue;
  }), [dueFilter, enrollments, search, statusFilter]);
  const stats = useMemo(() => ({
    total: enrollments.length,
    active: enrollments.filter((item) => item.status === "approved").length,
    completed: enrollments.filter((item) => item.status === "completed").length,
    overdue: enrollments.filter(isOverdue).length,
  }), [enrollments]);
  const pageCount = Math.max(1, Math.ceil(filteredEnrollments.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleEnrollments = filteredEnrollments.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function selectCourse(value: string) {
    setCourseId(value);
    setEnrollmentsLoading(true);
    setPage(1);
  }

  function openAssignment() {
    setLearnerId("");
    setDueDate("");
    setModalOpen(true);
  }

  async function assign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const created = await apiFetch<Enrollment>(`/api/courses/${courseId}/enrollments`, {
        method: "POST",
        body: JSON.stringify({ learnerId: Number(learnerId), dueDate: dueDate || null }),
      });
      setEnrollments((current) => [...current, created]);
      setModalOpen(false);
      setSuccess("Learner enrolled and access granted.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not assign learner.");
    } finally {
      setBusy(false);
    }
  }

  async function updateStatus(id: number, status: string) {
    setError("");
    try {
      const updated = await apiFetch<Enrollment>(`/api/enrollments/${id}${queryString({ status })}`, { method: "PATCH" });
      setEnrollments((current) => current.map((item) => item.id === id ? updated : item));
      setSuccess("Enrollment status updated.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not update enrollment.");
    }
  }

  async function exportCsv() {
    setError("");
    try {
      const csv = await apiFetch<string>(`/api/reports/enrollments/export${queryString({ courseId, status: statusFilter })}`);
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `enrollments-${selectedCourse?.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || courseId}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not export enrollments.");
    }
  }

  if (loading) return <LoadingState />;

  return (
    <div className="page-stack">
      <PageTitle title="Enrollment management" description="Assign learners to published courses and manage their access." action={<Button onClick={openAssignment} disabled={!courseId}><Icon name="plus" size={17} />Assign learner</Button>} />
      <ToastMessage message={error} type="error" />
      <ToastMessage message={success} type="success" />

      <section className="enrollment-stats">
        <StatCard label="Total enrollments" value={stats.total} icon="user" tone="blue" />
        <StatCard label="Active learners" value={stats.active} icon="book" tone="blue" />
        <StatCard label="Completed" value={stats.completed} icon="check" tone="green" />
        <StatCard label="Overdue" value={stats.overdue} icon="clock" tone="amber" />
      </section>

      <section className="enrollment-panel">
        <div className="enrollment-toolbar">
          <Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search learner name or ID" aria-label="Search enrollments" />
          <Select value={courseId} onChange={(event) => selectCourse(event.target.value)} aria-label="Course filter">{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</Select>
          <Select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} aria-label="Status filter"><option value="">All statuses</option><option value="approved">Approved</option><option value="pending">Pending</option><option value="rejected">Rejected</option><option value="completed">Completed</option></Select>
          <Select value={dueFilter} onChange={(event) => { setDueFilter(event.target.value); setPage(1); }} aria-label="Due date filter"><option value="">All due dates</option><option value="overdue">Overdue</option><option value="upcoming">Upcoming</option><option value="none">No due date</option></Select>
          <Button variant="secondary" onClick={exportCsv}>Export CSV</Button>
        </div>

        {enrollmentsLoading ? <LoadingState label="Loading enrollments..." /> : visibleEnrollments.length === 0 ? <EmptyState title="No enrollments found" message="Change the filters or assign a learner to this course." /> : (
          <div className="table-wrap">
            <table className="data-table enrollment-table">
              <thead><tr><th>Learner</th><th>Course</th><th>Enrolled</th><th>Due date</th><th>Status</th><th>Access</th></tr></thead>
              <tbody>{visibleEnrollments.map((item) => {
                const overdue = isOverdue(item);
                return <tr key={item.id}><td><strong>{item.learnerName}</strong><p>ID: {item.learnerId}</p></td><td>{selectedCourse?.title}</td><td>{formatDate(item.enrolledAt)}</td><td>{item.dueDate ? <span className={overdue ? "overdue-text" : ""}>{formatDate(item.dueDate)}{overdue ? " · Overdue" : ""}</span> : <span className="muted-text">No due date</span>}</td><td><Badge tone={item.status === "approved" || item.status === "completed" ? "green" : item.status === "pending" ? "amber" : "neutral"}>{item.status}</Badge></td><td>{item.status === "completed" ? <span className="muted-text">Read only</span> : <Select value={item.status} onChange={(event) => updateStatus(item.id, event.target.value)} aria-label={`Access for ${item.learnerName}`}><option value="approved">Approved</option><option value="pending">Pending</option><option value="rejected">Rejected</option></Select>}</td></tr>;
              })}</tbody>
            </table>
          </div>
        )}

        {filteredEnrollments.length > PAGE_SIZE ? <div className="pagination"><Button variant="secondary" className="button-small" disabled={currentPage === 1} onClick={() => setPage((current) => current - 1)}>Previous</Button><span>Page {currentPage} of {pageCount}</span><Button variant="secondary" className="button-small" disabled={currentPage === pageCount} onClick={() => setPage((current) => current + 1)}>Next</Button></div> : null}
      </section>

      <Modal open={modalOpen} title="Assign learner" onClose={() => setModalOpen(false)}>
        <form className="modal-form" onSubmit={assign}>
          <Field label="Course"><Select value={courseId} onChange={(event) => selectCourse(event.target.value)} required>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</Select></Field>
          <SearchableSelect
            label="Learner"
            value={learnerId}
            onChange={setLearnerId}
            placeholder="Search learner name or email"
            options={learners.map((learner) => ({ value: String(learner.id), label: `${learner.firstName} ${learner.lastName} · ${learner.email}` }))}
          />
          <Field label="Due date" hint="Optional"><Input type="datetime-local" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></Field>
          <div className="modal-actions"><Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button type="submit" disabled={busy || !learnerId}>{busy ? "Assigning..." : "Assign learner"}</Button></div>
        </form>
      </Modal>
    </div>
  );
}

function isOverdue(enrollment: Enrollment) {
  return enrollment.status === "approved" && enrollment.dueDate !== null && new Date(enrollment.dueDate).getTime() < Date.now();
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}
