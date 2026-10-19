"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { RoleGuard } from "@/components/auth/role-guard";
import { Badge, PageTitle, StatCard } from "@/components/ui/display";
import { EmptyState, LoadingState } from "@/components/ui/feedback";
import { ToastMessage } from "@/components/ui/toast";
import { Icon } from "@/components/ui/icon";
import { apiFetch } from "@/lib/api";
import type { Assessment, Attempt, Course, Enrollment, PageResponse } from "@/types/api";

interface ResultItem { course: Course; assessment: Assessment; attempt: Attempt; }

export default function ResultsPage() {
  return <RoleGuard permission="results.read"><ResultsContent /></RoleGuard>;
}

function ResultsContent() {
  const { user } = useAuth();
  const [results, setResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    if (user.role !== "LEARNER") return;

    async function load() {
      try {
        const enrollments = await apiFetch<Enrollment[]>("/api/enrollments/me?view=all");
        const groups = await Promise.all(enrollments.map(async ({ courseId }) => {
          const [course, assessmentPage] = await Promise.all([
            apiFetch<Course>(`/api/courses/${courseId}`),
            apiFetch<PageResponse<Assessment>>(`/api/courses/${courseId}/assessments?size=50`),
          ]);
          const rows = await Promise.all(assessmentPage.content.map(async (assessment) => {
            const attempts = await apiFetch<Attempt[]>(`/api/assessments/${assessment.id}/attempts/me`);
            return attempts.filter((attempt) => attempt.status === "graded" || attempt.status === "pending_grading").map((attempt) => ({ course, assessment, attempt }));
          }));
          return rows.flat();
        }));
        setResults(groups.flat().sort((a, b) => new Date(b.attempt.submittedAt ?? b.attempt.startedAt).getTime() - new Date(a.attempt.submittedAt ?? a.attempt.startedAt).getTime()));
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Could not load results.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [user]);

  if (user && user.role !== "LEARNER") {
    return <div className="page-stack"><PageTitle title="Results" description="Review learner submissions from the grading queue." /><Link href="/instructor/grading" className="button button-primary inline-button">Open grading queue</Link></div>;
  }

  const passedCount = results.filter(({ attempt }) => attempt.passed === true).length;
  const pendingCount = results.filter(({ attempt }) => attempt.status === "pending_grading").length;

  return (
    <div className="page-stack">
      <PageTitle title="My results" description="Review your submitted assessments and scores." />
      <ToastMessage message={error} type="error" />
      {loading ? <LoadingState label="Loading results..." /> : results.length === 0 ? <EmptyState title="No results yet" message="Completed assessments will appear here." /> : (
        <>
          <div className="results-summary">
            <StatCard label="Attempts" value={results.length} icon="results" tone="blue" />
            <StatCard label="Passed" value={passedCount} icon="check" tone="green" />
            <StatCard label="Pending grading" value={pendingCount} icon="clock" tone="amber" />
          </div>
          <div className="results-list">
            <div className="results-list-header"><span>Assessment</span><span>Score</span><span>Status</span><span /></div>
            {results.map(({ course, assessment, attempt }) => {
              const pending = attempt.status === "pending_grading" || attempt.percentage === null;
              return (
                <Link key={attempt.id} href={`/courses/${course.id}/assessments/${assessment.id}/results/${attempt.id}`} className="result-row">
                  <div><span>{course.title}</span><h2>{assessment.title}</h2><small>Attempt {attempt.attemptNumber}</small></div>
                  <div className="result-list-score"><strong>{pending ? "—" : `${Math.round(attempt.percentage ?? 0)}%`}</strong><small>{attempt.score} / {attempt.maxScore} points</small></div>
                  <Badge tone={pending ? "amber" : attempt.passed ? "green" : "neutral"}>{pending ? "Pending" : attempt.passed ? "Passed" : "Not passed"}</Badge>
                  <Icon name="chevronRight" size={17} />
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
