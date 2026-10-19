"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RoleGuard } from "@/components/auth/role-guard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/display";
import { ErrorBanner, LoadingState } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { Textarea } from "@/components/ui/form-field";
import { ToastMessage } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import type { AnswerItem, Assessment, Attempt, PageResponse, Question } from "@/types/api";

export function AssessmentView({ courseId, assessmentId }: { courseId: number; assessmentId: number }) {
  return <RoleGuard permission="assessment.attempt"><AssessmentContent courseId={courseId} assessmentId={assessmentId} /></RoleGuard>;
}

function AssessmentContent({ courseId, assessmentId }: { courseId: number; assessmentId: number }) {
  const router = useRouter();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [answers, setAnswers] = useState<Record<number, AnswerItem>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [assessmentPage, questionData, attemptData] = await Promise.all([
          apiFetch<PageResponse<Assessment>>(`/api/courses/${courseId}/assessments?size=50`),
          apiFetch<Question[]>(`/api/assessments/${assessmentId}/questions`),
          apiFetch<Attempt[]>(`/api/assessments/${assessmentId}/attempts/me`),
        ]);
        setAssessment(assessmentPage.content.find((item) => item.id === assessmentId) ?? null);
        setQuestions([...questionData].sort((a, b) => a.displayOrder - b.displayOrder));
        setAttempts(attemptData);
        const openAttempt = attemptData.find((item) => item.status === "in_progress");
        if (openAttempt) setAttempt(openAttempt);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Could not load this assessment.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [assessmentId, courseId]);

  useEffect(() => {
    if (!attempt || !assessment?.timeLimitMinutes) return;
    const startedAt = new Date(attempt.startedAt).getTime();
    const deadline = startedAt + assessment.timeLimitMinutes * 60_000;
    const update = () => setSecondsLeft(Math.max(0, Math.floor((deadline - Date.now()) / 1000)));
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [assessment, attempt]);

  const currentQuestion = questions[currentIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

  async function start() {
    setBusy(true);
    setError("");
    try {
      const started = await apiFetch<Attempt>(`/api/assessments/${assessmentId}/attempts`, { method: "POST" });
      setAttempt(started);
      setAttempts((current) => [...current, started]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not start the assessment.");
    } finally {
      setBusy(false);
    }
  }

  function setSingleAnswer(questionId: number, optionId: number) {
    setAnswers((current) => ({ ...current, [questionId]: { questionId, selectedOptionId: optionId } }));
  }

  function toggleMultipleAnswer(questionId: number, optionId: number) {
    setAnswers((current) => {
      const selected = current[questionId]?.selectedOptionIds ?? [];
      const next = selected.includes(optionId) ? selected.filter((id) => id !== optionId) : [...selected, optionId];
      if (next.length === 0) {
        const copy = { ...current };
        delete copy[questionId];
        return copy;
      }
      return { ...current, [questionId]: { questionId, selectedOptionIds: next } };
    });
  }

  function setTextAnswer(questionId: number, answerText: string) {
    setAnswers((current) => ({ ...current, [questionId]: { questionId, answerText } }));
  }

  async function submit() {
    if (!attempt || answeredCount === 0) {
      setError("Answer at least one question before submitting.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await apiFetch<Attempt>(`/api/attempts/${attempt.id}/submit`, {
        method: "POST",
        body: JSON.stringify({ answers: Object.values(answers) }),
      });
      sessionStorage.setItem(`lms_attempt_${result.id}`, JSON.stringify(result));
      router.push(`/courses/${courseId}/assessments/${assessmentId}/results/${result.id}`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not submit the assessment.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <LoadingState label="Loading assessment..." />;
  if (!assessment) return <ErrorBanner message={error || "Assessment not found."} />;

  if (!attempt) {
    return (
      <div className="assessment-intro">
        <Link href={`/courses/${courseId}`} className="back-link"><Icon name="chevronLeft" size={16} />Back to course</Link>
        <ToastMessage message={error} type="error" />
        <div className="assessment-intro-icon"><Icon name="results" size={32} /></div>
        <h1>{assessment.title}</h1>
        <p>{assessment.description || "Complete this assessment to test your knowledge."}</p>
        <div className="assessment-facts"><span><strong>{questions.length}</strong> questions</span><span><strong>{assessment.maxScore}</strong> points</span><span><strong>{assessment.timeLimitMinutes ?? "No"}</strong> {assessment.timeLimitMinutes ? "minutes" : "time limit"}</span></div>
        <p className="muted-text">Attempts used: {attempts.length} of {assessment.maxAttempts}</p>
        <Button onClick={start} disabled={busy || questions.length === 0}>{busy ? "Starting..." : "Start assessment"}</Button>
      </div>
    );
  }

  if (!currentQuestion) return <EmptyAssessment courseId={courseId} />;

  return (
    <div className="assessment-page">
      <div className="assessment-topline">
        <div><span className="eyebrow">{assessment.title}</span><h1>Question {currentIndex + 1} of {questions.length}</h1></div>
        {secondsLeft !== null ? <Badge tone={secondsLeft < 60 ? "amber" : "neutral"}><Icon name="clock" size={15} />{formatTime(secondsLeft)}</Badge> : null}
      </div>
      <ToastMessage message={error} type="error" />
      <div className="question-progress"><span style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} /></div>
      <section className="question-card">
        <div className="question-heading"><span>{currentQuestion.points} points</span><h2>{currentQuestion.questionText}</h2></div>
        {currentQuestion.questionType === "short_answer" ? (
          <Textarea rows={6} value={currentAnswer?.answerText ?? ""} onChange={(event) => setTextAnswer(currentQuestion.id, event.target.value)} placeholder="Write your answer..." />
        ) : (
          <div className="option-list">
            {currentQuestion.options.map((option) => {
              const selected = currentQuestion.questionType === "multiple_choice" ? currentAnswer?.selectedOptionIds?.includes(option.id) : currentAnswer?.selectedOptionId === option.id;
              return (
                <label className={`answer-option${selected ? " answer-option-selected" : ""}`} key={option.id}>
                  <input type={currentQuestion.questionType === "multiple_choice" ? "checkbox" : "radio"} name={`question-${currentQuestion.id}`} checked={Boolean(selected)} onChange={() => currentQuestion.questionType === "multiple_choice" ? toggleMultipleAnswer(currentQuestion.id, option.id) : setSingleAnswer(currentQuestion.id, option.id)} />
                  <span>{option.optionText}</span>
                </label>
              );
            })}
          </div>
        )}
      </section>
      <div className="assessment-actions">
        <Button variant="secondary" disabled={currentIndex === 0} onClick={() => setCurrentIndex((index) => index - 1)}><Icon name="chevronLeft" size={17} />Previous</Button>
        <span>{answeredCount} of {questions.length} answered</span>
        {currentIndex < questions.length - 1 ? <Button onClick={() => setCurrentIndex((index) => index + 1)}>Next<Icon name="chevronRight" size={17} /></Button> : <Button onClick={submit} disabled={busy}>{busy ? "Submitting..." : "Submit assessment"}</Button>}
      </div>
    </div>
  );
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function EmptyAssessment({ courseId }: { courseId: number }) {
  return <div className="assessment-intro"><h1>No questions available</h1><p>This assessment is not ready yet.</p><Link href={`/courses/${courseId}`} className="button button-secondary">Back to course</Link></div>;
}
