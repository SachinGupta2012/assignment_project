"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Badge, PageTitle } from "@/components/ui/display";
import { EmptyState, ErrorBanner, LoadingState } from "@/components/ui/feedback";
import { ToastMessage, useToast } from "@/components/ui/toast";
import { Input } from "@/components/ui/form-field";
import { Pagination } from "@/components/ui/pagination";
import { apiFetch, queryString } from "@/lib/api";
import type { AttemptAnswer } from "@/types/api";

const PAGE_SIZE = 10;

export default function GradingPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [pendingAnswers, setPendingAnswers] = useState<AttemptAnswer[]>([]);
  const [gradedAnswers, setGradedAnswers] = useState<AttemptAnswer[]>([]);
  const [marks, setMarks] = useState<Record<number, string>>({});
  const [feedback, setFeedback] = useState<Record<number, string>>({});
  const [reasons, setReasons] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const allowed = user?.role === "ADMIN" || user?.role === "INSTRUCTOR";

  useEffect(() => {
    if (!allowed) return;
    Promise.all([
      apiFetch<AttemptAnswer[]>("/api/grading/queue"),
      apiFetch<AttemptAnswer[]>("/api/grading/graded"),
    ])
      .then(([pending, graded]) => {
        const allAnswers = [...pending, ...graded];
        setPendingAnswers(pending);
        setGradedAnswers(graded);
        setMarks(Object.fromEntries(allAnswers.map((answer) => [answer.id, String(answer.pointsAwarded ?? 0)])));
        setFeedback(Object.fromEntries(allAnswers.map((answer) => [answer.id, answer.feedback ?? ""])));
      })
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Could not load the grading queue."))
      .finally(() => setLoading(false));
  }, [allowed]);

  async function grade(answer: AttemptAnswer, correction = false) {
    const points = Number(marks[answer.id]);
    if (Number.isNaN(points) || points < 0 || points > answer.points) {
      showToast(`Marks must be between 0 and ${answer.points}.`, "warning");
      return;
    }
    const scoreChanged = points !== Number(answer.pointsAwarded);
    if (correction && scoreChanged && !reasons[answer.id]?.trim()) {
      showToast("Enter a reason before changing an existing grade.", "warning");
      return;
    }
    setBusyId(answer.id);
    setError("");
    setSuccess("");
    try {
      const query = queryString({ points, feedback: feedback[answer.id], reason: reasons[answer.id] });
      const saved = await apiFetch<AttemptAnswer>(`/api/grading/answers/${answer.id}${query}`, { method: "PATCH" });
      if (correction) {
        setGradedAnswers((current) => current.map((item) => item.id === answer.id ? saved : item));
        setReasons((current) => ({ ...current, [answer.id]: "" }));
        setSuccess("Grade correction saved and recorded.");
      } else {
        setPendingAnswers((current) => current.filter((item) => item.id !== answer.id));
        setGradedAnswers((current) => [saved, ...current]);
        setSuccess("Grade saved and the learner result was updated.");
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not save the grade.");
    } finally {
      setBusyId(null);
    }
  }

  if (user && !allowed) return <ErrorBanner message="You do not have permission to grade assessments." />;

  return (
    <div className="page-stack">
      <PageTitle title="Grading and feedback" description="Review written answers, publish marks, and correct existing grades." />
      <ToastMessage message={error} type="error" />
      <ToastMessage message={success} type="success" />
      {loading ? <LoadingState label="Loading grading queue..." /> : <>
        <section className="grading-section">
          <div className="section-heading"><div><h2>Pending grading</h2><p>Short answers waiting for instructor review.</p></div><Badge tone="amber">{pendingAnswers.length} pending</Badge></div>
          {pendingAnswers.length === 0 ? <EmptyState title="Queue is clear" message="There are no written answers waiting for grading." /> : <GradingTable answers={pendingAnswers} marks={marks} feedback={feedback} reasons={reasons} busyId={busyId} onMarksChange={(id, value) => setMarks((current) => ({ ...current, [id]: value }))} onFeedbackChange={(id, value) => setFeedback((current) => ({ ...current, [id]: value }))} onReasonChange={(id, value) => setReasons((current) => ({ ...current, [id]: value }))} onSave={(answer) => grade(answer)} />}
        </section>
        <section className="grading-section">
          <div className="section-heading"><div><h2>Graded responses</h2><p>Update a score with a reason to create a correction record.</p></div><Badge tone="green">{gradedAnswers.length} graded</Badge></div>
          {gradedAnswers.length === 0 ? <EmptyState title="No graded responses" message="Graded short answers will appear here." /> : <GradingTable correction answers={gradedAnswers} marks={marks} feedback={feedback} reasons={reasons} busyId={busyId} onMarksChange={(id, value) => setMarks((current) => ({ ...current, [id]: value }))} onFeedbackChange={(id, value) => setFeedback((current) => ({ ...current, [id]: value }))} onReasonChange={(id, value) => setReasons((current) => ({ ...current, [id]: value }))} onSave={(answer) => grade(answer, true)} />}
        </section>
      </>}
    </div>
  );
}

interface GradingTableProps {
  answers: AttemptAnswer[];
  marks: Record<number, string>;
  feedback: Record<number, string>;
  reasons: Record<number, string>;
  busyId: number | null;
  correction?: boolean;
  onMarksChange: (id: number, value: string) => void;
  onFeedbackChange: (id: number, value: string) => void;
  onReasonChange: (id: number, value: string) => void;
  onSave: (answer: AttemptAnswer) => void;
}

function GradingTable({ answers, marks, feedback, reasons, busyId, correction = false, onMarksChange, onFeedbackChange, onReasonChange, onSave }: GradingTableProps) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(answers.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleAnswers = answers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="table-stack">
      <div className="table-wrap"><table className="data-table grading-table">
        <thead><tr><th>Attempt</th><th>Question and answer</th><th>Marks</th><th>Feedback</th>{correction ? <th>Correction reason</th> : null}<th>Action</th></tr></thead>
        <tbody>{visibleAnswers.map((answer) => (
          <tr key={answer.id}>
            <td>Attempt {answer.attemptNumber}</td>
            <td><strong>{answer.questionText}</strong><p>{answer.answerText || answer.selectedOptionText || "No answer"}</p></td>
            <td><div className="marks-input"><Input type="number" min="0" max={answer.points} step="0.5" value={marks[answer.id] ?? ""} onChange={(event) => onMarksChange(answer.id, event.target.value)} aria-label={`Marks for answer ${answer.id}`} /><span>/ {answer.points}</span></div></td>
            <td><Input value={feedback[answer.id] ?? ""} onChange={(event) => onFeedbackChange(answer.id, event.target.value)} placeholder="Learner feedback" aria-label={`Feedback for answer ${answer.id}`} /></td>
            {correction ? <td><Input value={reasons[answer.id] ?? ""} onChange={(event) => onReasonChange(answer.id, event.target.value)} placeholder="Required when score changes" aria-label={`Correction reason for answer ${answer.id}`} /></td> : null}
            <td><Button className="button-small" disabled={busyId === answer.id} onClick={() => onSave(answer)}>{busyId === answer.id ? "Saving..." : correction ? "Update" : "Save"}</Button></td>
          </tr>
        ))}</tbody>
      </table></div>
      <Pagination page={currentPage} totalPages={pageCount} onPageChange={setPage} />
    </div>
  );
}
