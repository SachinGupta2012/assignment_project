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
  if (attempt.status !== "graded" && attempt.status !== "pending_grading") {
    return <ErrorBanner message="This attempt was not submitted, so it does not have a result." />;
  }

  const pending = attempt.passed === null || attempt.status === "pending_grading";
  const percentage = attempt.percentage === null ? null : Math.round(attempt.percentage);
  const answerGroups = groupAnswers(answers);

  return (
    <div className="result-page">
      <div className="result-page-top"><Link href="/results" className="back-link"><Icon name="chevronLeft" size={16} />All results</Link><Badge tone="blue">Attempt {attempt.attemptNumber}</Badge></div>
      <section className={`result-hero result-hero-${pending ? "pending" : attempt.passed ? "success" : "failed"}`}>
        <div className={`result-icon ${pending ? "result-pending" : attempt.passed ? "result-pass" : "result-fail"}`}><Icon name={pending ? "clock" : attempt.passed ? "check" : "close"} size={34} /></div>
        <div className="result-hero-copy"><Badge tone={pending ? "amber" : attempt.passed ? "green" : "neutral"}>{pending ? "Pending grading" : attempt.passed ? "Passed" : "Not passed"}</Badge><h1>{pending ? "Assessment submitted" : attempt.passed ? "Assessment passed successfully" : "Assessment not passed"}</h1><p>{pending ? "Your written answers are waiting for instructor grading." : attempt.passed ? "Well done. You have successfully completed this assessment." : "Review your answers and try again if attempts remain."}</p></div>
      </section>
      <section className="result-metrics">
        <div className="result-metric"><span className="result-metric-icon"><Icon name="results" size={18} /></span><div><span>Earned points</span><strong>{attempt.score} / {attempt.maxScore}</strong></div></div>
        <div className="result-metric"><span className="result-metric-icon"><Icon name="results" size={18} /></span><div><span>Percentage</span><strong>{percentage === null ? "Pending" : `${percentage}%`}</strong></div></div>
        <div className="result-metric"><span className="result-metric-icon"><Icon name={pending ? "clock" : attempt.passed ? "check" : "close"} size={18} /></span><div><span>Outcome</span><Badge tone={pending ? "amber" : attempt.passed ? "green" : "neutral"}>{pending ? "Pending grading" : attempt.passed ? "Passed" : "Not passed"}</Badge></div></div>
        <div className="result-metric"><span className="result-metric-icon"><Icon name="user" size={18} /></span><div><span>Attempt</span><strong>#{attempt.attemptNumber}</strong></div></div>
      </section>
      {answerGroups.length > 0 ? <section className="answer-review"><div className="answer-review-title"><div><h2>Submitted answers</h2><p>Review your responses, awarded points, and feedback.</p></div><span>{answerGroups.length} responses</span></div><div>{answerGroups.map((answer, index) => <AnswerResult key={answer.questionId} answer={answer} index={index} pending={pending} />)}</div></section> : null}
      <div className="result-actions"><Link href={`/courses/${courseId}`} className="button button-primary">Back to course</Link><Link href="/results" className="button button-secondary">All results</Link></div>
    </div>
  );
}

interface GroupedAnswer {
  questionId: number;
  questionText: string;
  response: string;
  points: number;
  pointsAwarded: number;
  feedback: string | null;
  requiresManualGrading: boolean;
}

function AnswerResult({ answer, index, pending }: { answer: GroupedAnswer; index: number; pending: boolean }) {
  const correct = answer.points > 0 && answer.pointsAwarded >= answer.points;
  const partial = !correct && answer.pointsAwarded > 0;
  const awaitingReview = pending && answer.requiresManualGrading;
  const status = correct ? "Correct" : partial ? "Partial credit" : awaitingReview ? "Pending review" : "Incorrect";
  const explanation = correct
    ? "This response earned full points."
    : partial
      ? "This response earned partial credit. Review the instructor feedback for more detail."
      : awaitingReview
        ? "This response is waiting for instructor review."
        : "This response did not earn points. Review the course material before trying again.";

  return (
    <article className={`answer-result-card${correct ? " answer-result-correct" : ""}`}>
      <div className="answer-review-heading">
        <div><span>Question {index + 1}</span><h3>{answer.questionText}</h3></div>
        <div className="answer-result-score"><Badge tone={correct ? "green" : partial ? "blue" : awaitingReview ? "amber" : "neutral"}>{correct ? <Icon name="check" size={14} /> : null}{status}</Badge><strong>{answer.pointsAwarded} / {answer.points} points</strong></div>
      </div>
      <div className={`answer-response${correct ? " answer-response-correct" : ""}`}><span>Your answer</span><p>{answer.response || "No answer submitted"}</p></div>
      <div className="answer-explanation"><strong>Explanation</strong><p>{explanation}</p></div>
      {answer.feedback ? <div className="answer-feedback"><strong>Instructor feedback</strong><p>{answer.feedback}</p></div> : null}
    </article>
  );
}

function groupAnswers(answers: AttemptAnswer[]) {
  const grouped = new Map<number, GroupedAnswer>();

  for (const answer of answers) {
    const existing = grouped.get(answer.questionId);
    const response = answer.answerText || answer.selectedOptionText || "";
    if (existing) {
      existing.response = [existing.response, response].filter(Boolean).join(", ");
      existing.pointsAwarded += Number(answer.pointsAwarded);
      existing.feedback = existing.feedback || answer.feedback;
      existing.requiresManualGrading ||= answer.answerText !== null;
    } else {
      grouped.set(answer.questionId, {
        questionId: answer.questionId,
        questionText: answer.questionText,
        response,
        points: Number(answer.points),
        pointsAwarded: Number(answer.pointsAwarded),
        feedback: answer.feedback,
        requiresManualGrading: answer.answerText !== null,
      });
    }
  }

  return Array.from(grouped.values());
}
