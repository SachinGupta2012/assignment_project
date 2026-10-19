"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/display";
import { EmptyState, ErrorBanner, LoadingState } from "@/components/ui/feedback";
import { ToastMessage, useToast } from "@/components/ui/toast";
import { Input } from "@/components/ui/form-field";
import { apiFetch, queryString } from "@/lib/api";
import type { AttemptAnswer } from "@/types/api";

export default function GradingPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [answers, setAnswers] = useState<AttemptAnswer[]>([]);
  const [marks, setMarks] = useState<Record<number, string>>({});
  const [feedback, setFeedback] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const allowed = user?.role === "ADMIN" || user?.role === "INSTRUCTOR";

  useEffect(() => {
    if (!allowed) {
      setLoading(false);
      return;
    }
    apiFetch<AttemptAnswer[]>("/api/grading/queue")
      .then((data) => {
        setAnswers(data);
        setMarks(Object.fromEntries(data.map((answer) => [answer.id, String(answer.pointsAwarded ?? 0)])));
      })
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Could not load the grading queue."))
      .finally(() => setLoading(false));
  }, [allowed]);

  async function grade(answer: AttemptAnswer) {
    const points = Number(marks[answer.id]);
    if (Number.isNaN(points) || points < 0 || points > answer.points) {
      showToast(`Marks must be between 0 and ${answer.points}.`, "warning");
      return;
    }
    setBusyId(answer.id);
    setError("");
    setSuccess("");
    try {
      const query = queryString({ points, feedback: feedback[answer.id] });
      await apiFetch(`/api/grading/answers/${answer.id}${query}`, { method: "PATCH" });
      setAnswers((current) => current.filter((item) => item.id !== answer.id));
      setSuccess("Grade saved and the learner result was updated.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not save the grade.");
    } finally {
      setBusyId(null);
    }
  }

  if (user && !allowed) return <ErrorBanner message="You do not have permission to grade assessments." />;

  return (
    <div className="page-stack">
      <PageTitle title="Pending grading" description="Review written answers and publish marks." />
      <ToastMessage message={error} type="error" />
      <ToastMessage message={success} type="success" />
      {loading ? <LoadingState label="Loading grading queue..." /> : answers.length === 0 ? <EmptyState title="Queue is clear" message="There are no written answers waiting for grading." /> : (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Attempt</th><th>Question and answer</th><th>Marks</th><th>Feedback</th><th>Action</th></tr></thead>
            <tbody>{answers.map((answer) => (
              <tr key={answer.id}>
                <td>#{answer.attemptId}</td>
                <td><strong>{answer.questionText}</strong><p>{answer.answerText || answer.selectedOptionText || "No answer"}</p></td>
                <td><div className="marks-input"><Input type="number" min="0" max={answer.points} step="0.5" value={marks[answer.id] ?? ""} onChange={(event) => setMarks((current) => ({ ...current, [answer.id]: event.target.value }))} aria-label={`Marks for answer ${answer.id}`} /><span>/ {answer.points}</span></div></td>
                <td><Input value={feedback[answer.id] ?? ""} onChange={(event) => setFeedback((current) => ({ ...current, [answer.id]: event.target.value }))} placeholder="Optional feedback" aria-label={`Feedback for answer ${answer.id}`} /></td>
                <td><Button className="button-small" disabled={busyId === answer.id} onClick={() => grade(answer)}>{busyId === answer.id ? "Saving..." : "Save"}</Button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
