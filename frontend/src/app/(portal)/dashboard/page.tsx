"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Badge, PageTitle, ProgressBar, StatCard } from "@/components/ui/display";
import { EmptyState, LoadingState } from "@/components/ui/feedback";
import { ToastMessage } from "@/components/ui/toast";
import { apiFetch, queryString } from "@/lib/api";
import type { Course, Enrollment, PageResponse, Progress } from "@/types/api";

interface LearningItem {
  course: Course;
  progress: number;
  status: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<LearningItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;

    async function loadDashboard() {
      setLoading(true);
      setError("");
      try {
        if (user!.role === "LEARNER") {
          const enrollments = await apiFetch<Enrollment[]>("/api/enrollments/me?view=all");
          const rows = await Promise.all(enrollments.map(async (enrollment) => {
            const course = await apiFetch<Course>(`/api/courses/${enrollment.courseId}`);
            let progress = 0;
            try {
              progress = (await apiFetch<Progress>(`/api/courses/${enrollment.courseId}/progress`)).percentage;
            } catch {
              progress = 0;
            }
            return { course, progress, status: enrollment.status };
          }));
          setItems(rows);
        } else {
          const query = user!.role === "INSTRUCTOR" ? queryString({ instructorId: user!.id, size: 20 }) : "?size=20";
          const courses = await apiFetch<PageResponse<Course>>(`/api/courses/search${query}`);
          setItems(courses.content.map((course) => ({ course, progress: 0, status: course.isPublished ? "published" : "draft" })));
        }
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Could not load the dashboard.");
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
  }, [user]);

  const isLearner = user?.role === "LEARNER";
  const completed = items.filter((item) => item.progress === 100 || item.status === "completed").length;
  const active = items.filter((item) => item.progress > 0 && item.progress < 100).length;

  return (
    <div className="page-stack">
      <PageTitle
        title={`Welcome, ${user?.firstName ?? "Learner"}!`}
        description={isLearner ? "Here is your learning progress." : "Manage your learning content from one place."}
        action={!isLearner && user?.role !== "TRAINING_MANAGER" ? <Link href="/instructor/courses/new" className="button button-primary">Create course</Link> : undefined}
      />

      <ToastMessage message={error} type="error" />
      <section className="stats-grid" aria-label="Learning summary">
        <StatCard label={isLearner ? "Enrolled Courses" : "Courses"} value={items.length} icon="book" tone="blue" />
        <StatCard label={isLearner ? "Completed" : "Published"} value={isLearner ? completed : items.filter((item) => item.status === "published").length} icon="check" tone="green" />
        <StatCard label={isLearner ? "In Progress" : "Drafts"} value={isLearner ? active : items.filter((item) => item.status === "draft").length} icon="clock" tone="amber" />
      </section>

      <section className="section-block">
        <div className="section-heading"><h2>{isLearner ? "My courses" : "Recent courses"}</h2><Link href={isLearner ? "/my-courses" : "/courses"}>View all</Link></div>
        {loading ? <LoadingState label="Loading courses..." /> : items.length === 0 ? (
          <EmptyState title="No courses yet" message={isLearner ? "Browse the catalog to find a course." : "Create your first course to get started."} />
        ) : (
          <div className="learning-list">
            {items.slice(0, 5).map(({ course, progress, status }) => (
              <article className="learning-row" key={course.id}>
                <div className="learning-thumbnail">{course.title.charAt(0)}</div>
                <div className="learning-copy"><h3>{course.title}</h3><span>{course.instructorName}</span></div>
                {isLearner ? <div className="learning-progress"><ProgressBar value={progress} /><span>{progress}%</span></div> : <Badge tone={status === "published" ? "green" : "amber"}>{status}</Badge>}
                <Link href={`/courses/${course.id}`} className="button button-primary button-small">{isLearner ? "Continue" : "Open"}</Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
