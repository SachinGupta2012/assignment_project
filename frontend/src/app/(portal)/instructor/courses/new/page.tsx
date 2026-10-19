"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { CourseFormFields, type CourseFormValues } from "@/components/course/course-form-fields";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/display";
import { ErrorBanner } from "@/components/ui/feedback";
import { ToastMessage, useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import type { Course } from "@/types/api";

export default function CreateCoursePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [values, setValues] = useState<CourseFormValues>({ title: "", description: "", level: "beginner", duration: "60", enrollmentMode: "self_enroll", tags: "" });
  const [publish, setPublish] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const allowed = user?.role === "ADMIN" || user?.role === "INSTRUCTOR";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setError("");
    try {
      let course = await apiFetch<Course>("/api/courses", {
        method: "POST",
        body: JSON.stringify({
          title: values.title.trim(),
          description: values.description.trim(),
          instructorId: user.id,
          estimateDuration: Number(values.duration),
          level: values.level,
          enrollmentMode: values.enrollmentMode,
          tags: values.tags.trim(),
        }),
      });
      if (publish) {
        course = await apiFetch<Course>(`/api/courses/${course.id}/status?published=true`, { method: "PATCH" });
      }
      showToast("Course created successfully.");
      router.push(`/courses/${course.id}`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not create the course.");
    } finally {
      setSubmitting(false);
    }
  }

  if (user && !allowed) return <ErrorBanner message="You do not have permission to create courses." />;

  return (
    <div className="page-stack narrow-page">
      <PageTitle title="Create new course" description="Add the basics now. Modules and lessons can be added through the course API." />
      <ToastMessage message={error} type="error" />
      <form className="form-card" onSubmit={handleSubmit}>
        <CourseFormFields values={values} onChange={setValues} />
        <label className="checkbox-row"><input type="checkbox" checked={publish} onChange={(event) => setPublish(event.target.checked)} /><span><strong>Publish immediately</strong><small>Learners can only see published courses.</small></span></label>
        <div className="form-actions"><Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button><Button type="submit" disabled={submitting}>{submitting ? "Creating..." : "Create course"}</Button></div>
      </form>
    </div>
  );
}
