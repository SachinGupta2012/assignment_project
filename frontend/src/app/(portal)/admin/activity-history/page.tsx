"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge, PageTitle } from "@/components/ui/display";
import { EmptyState, LoadingState } from "@/components/ui/feedback";
import { Field, Input, Select } from "@/components/ui/form-field";
import { Pagination } from "@/components/ui/pagination";
import { ToastMessage } from "@/components/ui/toast";
import { apiFetch, queryString } from "@/lib/api";
import type { ActivityHistoryRecord, PageResponse } from "@/types/api";

const PAGE_SIZE = 10;
const ACTIONS = [
  "COURSE_PUBLISHED", "COURSE_UNPUBLISHED", "COURSE_ARCHIVED", "COURSE_RESTORED",
  "ENROLLMENT_CREATED", "ENROLLMENT_REMOVED", "LESSON_COMPLETED", "COURSE_COMPLETED",
  "COURSE_COMPLETION_REVOKED", "ATTEMPT_SUBMITTED", "GRADE_ASSIGNED", "GRADE_PUBLISHED",
  "GRADE_CHANGED",
];

interface Filters {
  actor: string;
  action: string;
  entityType: string;
  from: string;
  to: string;
}

const emptyFilters: Filters = { actor: "", action: "", entityType: "", from: "", to: "" };

export default function ActivityHistoryPage() {
  const [draftFilters, setDraftFilters] = useState<Filters>(emptyFilters);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [records, setRecords] = useState<ActivityHistoryRecord[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const query = queryString({ ...filters, page, size: PAGE_SIZE, sort: "createdAt,desc" });
    apiFetch<PageResponse<ActivityHistoryRecord>>(`/api/admin/activity-history${query}`)
      .then((data) => {
        if (!active) return;
        setRecords(data.content);
        setTotalPages(Math.max(1, data.totalPages));
        setTotalElements(data.totalElements);
      })
      .catch((requestError) => {
        if (active) setError(requestError instanceof Error ? requestError.message : "Could not load activity history.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filters, page]);

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setPage(0);
    setFilters({ ...draftFilters });
  }

  function clearFilters() {
    setLoading(true);
    setError("");
    setDraftFilters({ ...emptyFilters });
    setFilters({ ...emptyFilters });
    setPage(0);
  }

  function changePage(nextPage: number) {
    setLoading(true);
    setError("");
    setPage(nextPage);
  }

  return (
    <div className="page-stack">
      <PageTitle title="Activity history" description="Review platform audit events and the users who performed them." />
      <ToastMessage message={error} type="error" />

      <form className="management-panel activity-filters" onSubmit={applyFilters}>
        <Field label="Actor"><Input value={draftFilters.actor} onChange={(event) => setDraftFilters((current) => ({ ...current, actor: event.target.value }))} placeholder="Name or email" /></Field>
        <Field label="Action"><Select value={draftFilters.action} onChange={(event) => setDraftFilters((current) => ({ ...current, action: event.target.value }))}><option value="">All actions</option>{ACTIONS.map((action) => <option key={action} value={action}>{formatLabel(action)}</option>)}</Select></Field>
        <Field label="Entity"><Select value={draftFilters.entityType} onChange={(event) => setDraftFilters((current) => ({ ...current, entityType: event.target.value }))}><option value="">All entities</option><option value="course">Course</option><option value="enrollment">Enrollment</option><option value="lesson">Lesson</option><option value="attempt">Attempt</option><option value="attempt_answer">Attempt answer</option></Select></Field>
        <Field label="From"><Input type="date" value={draftFilters.from} onChange={(event) => setDraftFilters((current) => ({ ...current, from: event.target.value }))} /></Field>
        <Field label="To"><Input type="date" value={draftFilters.to} onChange={(event) => setDraftFilters((current) => ({ ...current, to: event.target.value }))} /></Field>
        <div className="activity-filter-actions"><Button type="submit">Apply filters</Button><Button type="button" variant="secondary" onClick={clearFilters}>Clear</Button></div>
      </form>

      <section className="management-panel activity-history-panel">
        <div className="section-heading"><div><h2>Audit events</h2><p>{totalElements} recorded events</p></div></div>
        {loading ? <LoadingState label="Loading activity history..." /> : records.length === 0 ? <EmptyState title="No activity found" message="No audit events match the selected filters." /> : (
          <div className="table-wrap">
            <table className="data-table activity-history-table">
              <thead><tr><th>Date and time</th><th>Actor</th><th>Role</th><th>Action</th><th>Entity</th></tr></thead>
              <tbody>{records.map((record) => <tr key={record.id}>
                <td>{formatDateTime(record.createdAt)}</td>
                <td><strong>{record.actorName}</strong>{record.actorEmail ? <p>{record.actorEmail}</p> : null}</td>
                <td>{record.actorRole ? <Badge tone="blue">{formatLabel(record.actorRole)}</Badge> : <span className="muted-text">System</span>}</td>
                <td><Badge tone={actionTone(record.action)}>{formatLabel(record.action)}</Badge></td>
                <td><strong>{formatLabel(record.entityType ?? "Unknown")}</strong><p>{record.entityId === null ? "No entity ID" : `ID: ${record.entityId}`}</p></td>
              </tr>)}</tbody>
            </table>
          </div>
        )}
        <Pagination page={page + 1} totalPages={totalPages} disabled={loading} onPageChange={(nextPage) => changePage(nextPage - 1)} />
      </section>
    </div>
  );
}

function formatLabel(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function actionTone(action: string): "green" | "amber" | "neutral" | "blue" {
  if (action.includes("COMPLETED") || action.includes("PUBLISHED") || action === "ENROLLMENT_CREATED") return "green";
  if (action.includes("REMOVED") || action.includes("REVOKED") || action.includes("ARCHIVED")) return "amber";
  if (action.includes("CHANGED") || action.includes("ASSIGNED")) return "blue";
  return "neutral";
}
