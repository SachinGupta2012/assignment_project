"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Badge, PageTitle } from "@/components/ui/display";
import { EmptyState, LoadingState } from "@/components/ui/feedback";
import { ToastMessage } from "@/components/ui/toast";
import { Field, Input, Select } from "@/components/ui/form-field";
import { apiFetch, queryString } from "@/lib/api";
import type { Course, Enrollment, PageResponse, User } from "@/types/api";

export default function EnrollmentManagementPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [learners, setLearners] = useState<User[]>([]);
  const [courseId, setCourseId] = useState("");
  const [learnerId, setLearnerId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const coursePage = await apiFetch<PageResponse<Course>>("/api/courses?size=100&sort=title,asc");
        setCourses(coursePage.content);
        if (coursePage.content[0]) setCourseId(String(coursePage.content[0].id));
        if (user?.role === "ADMIN") {
          const users = await apiFetch<User[]>("/api/admin/users");
          setLearners(users.filter((item) => item.role === "LEARNER"));
        }
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Could not load enrollment data.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [user?.role]);

  useEffect(() => {
    if (!courseId) return;
    apiFetch<PageResponse<Enrollment>>(`/api/courses/${courseId}/enrollments?size=100`)
      .then((data) => setEnrollments(data.content))
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Could not load enrollments."));
  }, [courseId]);

  async function assign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setSuccess("");
    try {
      const created = await apiFetch<Enrollment>(`/api/courses/${courseId}/enrollments`, { method: "POST", body: JSON.stringify({ learnerId: Number(learnerId), dueDate: dueDate || null }) });
      setEnrollments((current) => [...current, created]);
      setLearnerId(""); setDueDate(""); setSuccess("Learner assigned successfully.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not assign learner.");
    } finally { setBusy(false); }
  }

  async function updateStatus(id: number, status: string) {
    try {
      const updated = await apiFetch<Enrollment>(`/api/enrollments/${id}${queryString({ status })}`, { method: "PATCH" });
      setEnrollments((current) => current.map((item) => item.id === id ? updated : item));
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Could not update enrollment."); }
  }

  if (loading) return <LoadingState />;
  return (
    <div className="page-stack">
      <PageTitle title="Enrollment management" description="Assign learners and approve or reject enrollment requests." />
      <ToastMessage message={error} type="error" /><ToastMessage message={success} type="success" />
      <section className="management-grid">
        <form className="form-card" onSubmit={assign}>
          <h2>Assign learner</h2>
          <Field label="Course"><Select value={courseId} onChange={(event) => setCourseId(event.target.value)} required>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</Select></Field>
          <Field label="Learner">
            {learners.length > 0 ? <Select value={learnerId} onChange={(event) => setLearnerId(event.target.value)} required><option value="">Choose learner</option>{learners.map((learner) => <option key={learner.id} value={learner.id}>{learner.firstName} {learner.lastName} ({learner.id})</option>)}</Select> : <Input type="number" min="1" value={learnerId} onChange={(event) => setLearnerId(event.target.value)} placeholder="Enter learner ID" required />}
          </Field>
          <Field label="Due date"><Input type="datetime-local" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></Field>
          <Button type="submit" disabled={busy || !courseId}>{busy ? "Assigning..." : "Assign learner"}</Button>
          {user?.role === "TRAINING_MANAGER" ? <p className="field-hint">The backend does not expose the user list to Training Managers, so a learner ID is required.</p> : null}
        </form>
        <div className="management-panel"><h2>Course enrollments</h2>{enrollments.length === 0 ? <EmptyState title="No enrollments" message="Select a course or assign its first learner." /> : <div className="compact-list">{enrollments.map((item) => <article key={item.id}><div><strong>{item.learnerName}</strong><small>ID: {item.learnerId}</small></div><Badge tone={item.status === "approved" ? "green" : item.status === "pending" ? "amber" : "neutral"}>{item.status}</Badge><Select value={item.status} onChange={(event) => updateStatus(item.id, event.target.value)} aria-label={`Status for ${item.learnerName}`}><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></Select></article>)}</div>}</div>
      </section>
    </div>
  );
}
