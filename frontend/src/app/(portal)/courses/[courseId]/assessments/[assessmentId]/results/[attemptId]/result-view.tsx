"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/display";
import { ErrorBanner, LoadingState } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { apiFetch } from "@/lib/api";
import type { Attempt, AttemptAnswer } from "@/types/api";

export function ResultView({ courseId, assessmentId, attemptId }: { courseId: number; assessmentId: number; attemptId: number }) {
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [answers, setAnswers] = useState<AttemptAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const cached = sessionStorage.getItem(`lms_attempt_${attemptId}`);
        const [attempts, answerData] = await Promise.all([
          apiFetch<Attempt[]>(`/api/assessments/${assessmentId}/attempts/me`),
          apiFetch<AttemptAnswer[]>(`/api/attempts/${attemptId}/answers`),
        ]);
        setAttempt(attempts.find((item) => item.id === attemptId) ?? (cached ? JSON.parse(cached) as Attempt : null));
        setAnswers(answerData);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Could not load this result.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [assessmentId, attemptId]);

  if (loading) return <LoadingState label="Loading result..." />;
  if (!attempt) return <ErrorBanner message={error || "Result not found."} />;

  const pending = attempt.passed === null || attempt.status === "pending_grading";

  return (
    <div className="result-page">
      <div className={`result-icon ${pending ? "result-pending" : attempt.passed ? "result-pass" : "result-fail"}`}><Icon name={pending ? "clock" : attempt.passed ? "check" : "close"} size={34} /></div>
      <h1>{pending ? "Assessment submitted" : attempt.passed ? "Great work!" : "Keep learning"}</h1>
      <p>{pending ? "Your written answers are waiting for grading." : attempt.passed ? "You passed this assessment." : "Review the course and try again."}</p>
      <section className="score-card">
        <span>Your score</span><strong>{attempt.score} / {attempt.maxScore}</strong><b>{Math.round(attempt.percentage)}%</b>
        <Badge tone={pending ? "amber" : attempt.passed ? "green" : "neutral"}>{pending ? "Pending grading" : attempt.passed ? "Passed" : "Not passed"}</Badge>
      </section>
      {answers.length > 0 ? <details className="answer-review"><summary>View submitted answers</summary><div>{answers.map((answer) => <article key={answer.id}><h3>{answer.questionText}</h3><p>{answer.answerText || answer.selectedOptionText || "No answer"}</p><span>{answer.pointsAwarded} / {answer.points} points</span>{answer.feedback ? <small>{answer.feedback}</small> : null}</article>)}</div></details> : null}
      <div className="result-actions"><Link href={`/courses/${courseId}`} className="button button-primary">Back to course</Link><Link href="/results" className="button button-secondary">All results</Link></div>
    </div>
  );
}
