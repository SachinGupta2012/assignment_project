"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/display";
import { ErrorBanner } from "@/components/ui/feedback";
import { ToastMessage, useToast } from "@/components/ui/toast";
import { Field, Input, Select, Textarea } from "@/components/ui/form-field";
import { apiFetch } from "@/lib/api";
import type { Course } from "@/types/api";

export default function CreateCoursePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState("beginner");
  const [duration, setDuration] = useState("60");
  const [enrollmentMode, setEnrollmentMode] = useState("self_enroll");
  const [tags, setTags] = useState("");
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
          title: title.trim(),
          description: description.trim(),
          instructorId: user.id,
          estimateDuration: Number(duration),
          level,
          enrollmentMode,
          tags: tags.trim(),
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
        <Field label="Course title"><Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Enter course title" maxLength={500} required /></Field>
        <Field label="Description"><Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What will learners gain from this course?" rows={5} /></Field>
        <div className="form-grid">
          <Field label="Level"><Select value={level} onChange={(event) => setLevel(event.target.value)}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></Select></Field>
          <Field label="Estimated duration (minutes)"><Input type="number" min="1" value={duration} onChange={(event) => setDuration(event.target.value)} required /></Field>
        </div>
        <div className="form-grid">
          <Field label="Enrollment mode"><Select value={enrollmentMode} onChange={(event) => setEnrollmentMode(event.target.value)}><option value="open">Open</option><option value="self_enroll">Self enrollment</option><option value="instructor_approval">Instructor approval</option></Select></Field>
          <Field label="Tags" hint="Separate tags with commas."><Input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="java, programming" /></Field>
        </div>
        <label className="checkbox-row"><input type="checkbox" checked={publish} onChange={(event) => setPublish(event.target.checked)} /><span><strong>Publish immediately</strong><small>Learners can only see published courses.</small></span></label>
        <div className="form-actions"><Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button><Button type="submit" disabled={submitting}>{submitting ? "Creating..." : "Create course"}</Button></div>
      </form>
    </div>
  );
}
