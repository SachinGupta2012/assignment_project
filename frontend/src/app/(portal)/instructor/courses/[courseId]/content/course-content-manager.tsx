"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge, PageTitle } from "@/components/ui/display";
import { EmptyState, ErrorBanner, LoadingState } from "@/components/ui/feedback";
import { Field, Input, Select, Textarea } from "@/components/ui/form-field";
import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import { ToastMessage, useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import { getCourseContent, type ModuleWithLessons } from "@/lib/courses";
import type { Assessment, Course, Lesson, PageResponse, QuestionDetail } from "@/types/api";

type QuestionType = "single_choice" | "multiple_choice" | "short_answer";
type ContentModal = "module" | "lesson" | "assessment" | "question";

interface DraftOption {
  optionText: string;
  isCorrect: boolean;
}

const emptyOptions: DraftOption[] = [
  { optionText: "", isCorrect: true },
  { optionText: "", isCorrect: false },
];

function messageFrom(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function CourseContentManager({ courseId }: { courseId: number }) {
  const { showToast } = useToast();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<ModuleWithLessons[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [questions, setQuestions] = useState<Record<number, QuestionDetail[]>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeModal, setActiveModal] = useState<ContentModal | null>(null);
  const [expandedModules, setExpandedModules] = useState<number[]>([]);
  const [expandedAssessments, setExpandedAssessments] = useState<number[]>([]);

  const [moduleId, setModuleId] = useState<number | null>(null);
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleDescription, setModuleDescription] = useState("");
  const [moduleOrder, setModuleOrder] = useState("1");
  const [moduleRequired, setModuleRequired] = useState(true);

  const [lessonId, setLessonId] = useState<number | null>(null);
  const [lessonModuleId, setLessonModuleId] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonType, setLessonType] = useState("text");
  const [lessonUrl, setLessonUrl] = useState("");
  const [lessonBody, setLessonBody] = useState("");
  const [lessonOrder, setLessonOrder] = useState("1");
  const [lessonDuration, setLessonDuration] = useState("");
  const [lessonRequired, setLessonRequired] = useState(true);

  const [assessmentTitle, setAssessmentTitle] = useState("");
  const [assessmentDescription, setAssessmentDescription] = useState("");
  const [assessmentModuleId, setAssessmentModuleId] = useState("");
  const [passingScore, setPassingScore] = useState("60");
  const [timeLimit, setTimeLimit] = useState("");
  const [maxAttempts, setMaxAttempts] = useState("3");
  const [assessmentOrder, setAssessmentOrder] = useState("1");

  const [questionAssessmentId, setQuestionAssessmentId] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState<QuestionType>("single_choice");
  const [questionPoints, setQuestionPoints] = useState("1");
  const [questionOrder, setQuestionOrder] = useState("1");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [explanation, setExplanation] = useState("");
  const [options, setOptions] = useState<DraftOption[]>(emptyOptions);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [courseData, content, assessmentData] = await Promise.all([
          apiFetch<Course>(`/api/courses/${courseId}`),
          getCourseContent(courseId),
          apiFetch<PageResponse<Assessment>>(`/api/courses/${courseId}/assessments?size=100`),
        ]);
        const questionEntries = await Promise.all(assessmentData.content.map(async (assessment) => [
          assessment.id,
          await apiFetch<QuestionDetail[]>(`/api/assessments/${assessment.id}/questions/with-answers`),
        ] as const));
        setCourse(courseData);
        setModules(content);
        setAssessments(assessmentData.content);
        setQuestions(Object.fromEntries(questionEntries));
        setExpandedModules(content[0] ? [content[0].id] : []);
        setExpandedAssessments(assessmentData.content[0] ? [assessmentData.content[0].id] : []);
        setLessonModuleId(content[0] ? String(content[0].id) : "");
        setAssessmentModuleId(content[0] ? String(content[0].id) : "");
        setQuestionAssessmentId(assessmentData.content[0] ? String(assessmentData.content[0].id) : "");
      } catch (requestError) {
        setError(messageFrom(requestError, "Could not load course content."));
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [courseId]);

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  function toggleExpanded(id: number, type: "module" | "assessment") {
    const current = type === "module" ? expandedModules : expandedAssessments;
    const update = type === "module" ? setExpandedModules : setExpandedAssessments;
    update(current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function closeModal() {
    if (!busy) setActiveModal(null);
  }

  function addModule() {
    resetModuleForm();
    clearMessages();
    setActiveModal("module");
  }

  function addLesson() {
    resetLessonForm();
    setLessonModuleId(modules[0] ? String(modules[0].id) : "");
    clearMessages();
    setActiveModal("lesson");
  }

  function resetAssessmentForm() {
    setAssessmentTitle("");
    setAssessmentDescription("");
    setAssessmentModuleId(modules[0] ? String(modules[0].id) : "");
    setPassingScore("60");
    setTimeLimit("");
    setMaxAttempts("3");
    setAssessmentOrder(String(assessments.length + 1));
  }

  function addAssessment() {
    resetAssessmentForm();
    clearMessages();
    setActiveModal("assessment");
  }

  function resetQuestionForm() {
    setQuestionAssessmentId(assessments[0] ? String(assessments[0].id) : "");
    setQuestionText("");
    setQuestionType("single_choice");
    setQuestionPoints("1");
    setQuestionOrder("1");
    setCorrectAnswer("");
    setExplanation("");
    setOptions(emptyOptions.map((option) => ({ ...option })));
  }

  function addQuestion() {
    resetQuestionForm();
    clearMessages();
    setActiveModal("question");
  }

  function resetModuleForm() {
    setModuleId(null);
    setModuleTitle("");
    setModuleDescription("");
    setModuleOrder(String(modules.length + 1));
    setModuleRequired(true);
  }

  function editModule(module: ModuleWithLessons) {
    setModuleId(module.id);
    setModuleTitle(module.title);
    setModuleDescription(module.description ?? "");
    setModuleOrder(String(module.displayOrder));
    setModuleRequired(module.isRequired);
    clearMessages();
    setActiveModal("module");
  }

  async function saveModule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    clearMessages();
    try {
      const path = moduleId
        ? `/api/courses/${courseId}/modules/${moduleId}`
        : `/api/courses/${courseId}/modules`;
      const saved = await apiFetch<ModuleWithLessons>(path, {
        method: moduleId ? "PUT" : "POST",
        body: JSON.stringify({
          title: moduleTitle.trim(),
          description: moduleDescription.trim(),
          displayOrder: Number(moduleOrder),
          isRequired: moduleRequired,
        }),
      });
      setModules((current) => {
        const next = moduleId
          ? current.map((item) => item.id === saved.id ? { ...saved, lessons: item.lessons } : item)
          : [...current, { ...saved, lessons: [] }];
        return next.sort((a, b) => a.displayOrder - b.displayOrder);
      });
      if (!lessonModuleId) setLessonModuleId(String(saved.id));
      if (!assessmentModuleId) setAssessmentModuleId(String(saved.id));
      setSuccess(moduleId ? "Module updated." : "Module created.");
      resetModuleForm();
      setActiveModal(null);
    } catch (requestError) {
      setError(messageFrom(requestError, "Could not save the module."));
    } finally {
      setBusy(false);
    }
  }

  function resetLessonForm() {
    setLessonId(null);
    setLessonTitle("");
    setLessonType("text");
    setLessonUrl("");
    setLessonBody("");
    setLessonOrder("1");
    setLessonDuration("");
    setLessonRequired(true);
  }

  function editLesson(module: ModuleWithLessons, lesson: Lesson) {
    setLessonId(lesson.id);
    setLessonModuleId(String(module.id));
    setLessonTitle(lesson.title);
    setLessonType(lesson.contentType);
    setLessonUrl(lesson.contentUrl ?? "");
    setLessonBody(lesson.contentBody ?? "");
    setLessonOrder(String(lesson.displayOrder));
    setLessonDuration(lesson.duration ? String(lesson.duration) : "");
    setLessonRequired(lesson.isRequired);
    clearMessages();
    setActiveModal("lesson");
  }

  async function saveLesson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!lessonModuleId) return;
    setBusy(true);
    clearMessages();
    const selectedModuleId = Number(lessonModuleId);
    try {
      const base = `/api/courses/${courseId}/modules/${selectedModuleId}/lessons`;
      const saved = await apiFetch<Lesson>(lessonId ? `${base}/${lessonId}` : base, {
        method: lessonId ? "PUT" : "POST",
        body: JSON.stringify({
          title: lessonTitle.trim(),
          contentType: lessonType,
          contentUrl: lessonUrl.trim() || null,
          contentBody: lessonBody.trim() || null,
          displayOrder: Number(lessonOrder),
          isRequired: lessonRequired,
          duration: lessonDuration ? Number(lessonDuration) : null,
        }),
      });
      setModules((current) => current.map((module) => {
        if (module.id !== selectedModuleId) return module;
        const lessons = lessonId
          ? module.lessons.map((item) => item.id === saved.id ? saved : item)
          : [...module.lessons, saved];
        return { ...module, lessons: lessons.sort((a, b) => a.displayOrder - b.displayOrder) };
      }));
      setSuccess(lessonId ? "Lesson updated." : "Lesson created.");
      resetLessonForm();
      setActiveModal(null);
    } catch (requestError) {
      setError(messageFrom(requestError, "Could not save the lesson."));
    } finally {
      setBusy(false);
    }
  }

  async function createAssessment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    clearMessages();
    try {
      const saved = await apiFetch<Assessment>(`/api/courses/${courseId}/assessments`, {
        method: "POST",
        body: JSON.stringify({
          moduleId: assessmentModuleId ? Number(assessmentModuleId) : null,
          title: assessmentTitle.trim(),
          description: assessmentDescription.trim(),
          passingScore: Number(passingScore),
          timeLimitMinutes: timeLimit ? Number(timeLimit) : null,
          maxAttempts: Number(maxAttempts),
          displayOrder: Number(assessmentOrder),
        }),
      });
      setAssessments((current) => [...current, saved].sort((a, b) => a.displayOrder - b.displayOrder));
      setQuestions((current) => ({ ...current, [saved.id]: [] }));
      setQuestionAssessmentId(String(saved.id));
      setSuccess("Assessment created.");
      resetAssessmentForm();
      setActiveModal(null);
    } catch (requestError) {
      setError(messageFrom(requestError, "Could not create the assessment."));
    } finally {
      setBusy(false);
    }
  }

  function updateOption(index: number, values: Partial<DraftOption>) {
    setOptions((current) => current.map((option, optionIndex) => {
      if (questionType === "single_choice" && values.isCorrect) {
        return optionIndex === index ? { ...option, ...values } : { ...option, isCorrect: false };
      }
      return optionIndex === index ? { ...option, ...values } : option;
    }));
  }

  function changeQuestionType(value: QuestionType) {
    setQuestionType(value);
    if (value === "single_choice") {
      setOptions((current) => current.map((option, index) => ({ ...option, isCorrect: index === 0 })));
    }
  }

  async function createQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!questionAssessmentId) return;
    const choiceOptions = options.filter((option) => option.optionText.trim());
    if (questionType !== "short_answer" && (!choiceOptions.length || !choiceOptions.some((option) => option.isCorrect))) {
      showToast("Add at least one correct option.", "warning");
      return;
    }
    setBusy(true);
    clearMessages();
    try {
      const assessmentId = Number(questionAssessmentId);
      const saved = await apiFetch<QuestionDetail>(`/api/assessments/${assessmentId}/questions`, {
        method: "POST",
        body: JSON.stringify({
          questionText: questionText.trim(),
          questionType,
          points: Number(questionPoints),
          correctAnswer: questionType === "short_answer" ? correctAnswer.trim() : null,
          explanation: explanation.trim() || null,
          displayOrder: Number(questionOrder),
          options: questionType === "short_answer" ? [] : choiceOptions.map((option, index) => ({
            ...option,
            optionText: option.optionText.trim(),
            displayOrder: index + 1,
          })),
        }),
      });
      setQuestions((current) => ({ ...current, [assessmentId]: [...(current[assessmentId] ?? []), saved] }));
      setSuccess("Question added.");
      resetQuestionForm();
      setActiveModal(null);
    } catch (requestError) {
      setError(messageFrom(requestError, "Could not add the question."));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <LoadingState label="Loading course content..." />;
  if (!course) return <ErrorBanner message={error || "Course not found."} />;

  return (
    <div className="page-stack">
      <PageTitle
        title={`Manage ${course.title}`}
        description="Create and update the content supported by the LMS API."
        action={<Link href={`/courses/${courseId}`} className="button button-secondary">View course</Link>}
      />
      <ToastMessage message={error} type="error" />
      <ToastMessage message={success} type="success" />

      <section className="builder-panel">
        <div className="builder-panel-header">
          <div><h2>Course structure</h2><p>Organize modules and lessons for your course.</p></div>
          <div className="builder-panel-actions"><Button type="button" onClick={addModule}><Icon name="plus" size={16} />Add module</Button><Button type="button" variant="secondary" onClick={addLesson} disabled={!modules.length}><Icon name="plus" size={16} />Add lesson</Button></div>
        </div>
        {!modules.length ? <EmptyState title="No modules yet" message="Create the first module to start building this course." /> : (
          <div className="builder-accordion">{modules.map((module) => {
            const expanded = expandedModules.includes(module.id);
            return (
              <article key={module.id} className="builder-accordion-item">
                <div className="builder-accordion-heading">
                  <button type="button" className="builder-toggle" onClick={() => toggleExpanded(module.id, "module")} aria-expanded={expanded}>
                    <span className={`builder-chevron${expanded ? " builder-chevron-open" : ""}`}><Icon name="chevronRight" size={16} /></span>
                    <span className="builder-heading-copy"><strong>{module.displayOrder}. {module.title}</strong><small>{module.description || "No description"}</small></span>
                    <Badge tone="blue">{module.lessons.length} lessons</Badge>
                  </button>
                  <div className="builder-row-actions"><button type="button" className="builder-icon-action" onClick={() => editModule(module)} aria-label={`Edit ${module.title}`}><Icon name="edit" size={16} /></button><button type="button" className="builder-icon-action builder-delete" disabled title="Delete is not available in the backend" aria-label={`Delete ${module.title}`}><Icon name="trash" size={16} /></button></div>
                </div>
                {expanded ? <div className="builder-children">{module.lessons.length ? module.lessons.map((lesson) => (
                  <div key={lesson.id} className="builder-child-row">
                    <Icon name="grip" size={16} />
                    <span className="builder-child-copy"><strong>{lesson.displayOrder}. {lesson.title}</strong></span>
                    <small>{lesson.contentType}{lesson.duration ? ` · ${lesson.duration} min` : ""}</small>
                    <div className="builder-row-actions"><button type="button" className="builder-icon-action" onClick={() => editLesson(module, lesson)} aria-label={`Edit ${lesson.title}`}><Icon name="edit" size={16} /></button><button type="button" className="builder-icon-action builder-delete" disabled title="Delete is not available in the backend" aria-label={`Delete ${lesson.title}`}><Icon name="trash" size={16} /></button></div>
                  </div>
                )) : <p className="builder-empty-row">No lessons in this module.</p>}</div> : null}
              </article>
            );
          })}</div>
        )}
      </section>

      <section className="builder-panel">
        <div className="builder-panel-header">
          <div><h2>Assessments</h2><p>Manage assessments and questions for your course.</p></div>
          <div className="builder-panel-actions"><Button type="button" onClick={addAssessment}><Icon name="plus" size={16} />Add assessment</Button><Button type="button" variant="secondary" onClick={addQuestion} disabled={!assessments.length}><Icon name="plus" size={16} />Add question</Button></div>
        </div>
        {!assessments.length ? <EmptyState title="No assessments yet" message="Create an assessment before adding questions." /> : (
          <div className="builder-accordion">{assessments.map((assessment) => {
            const expanded = expandedAssessments.includes(assessment.id);
            const assessmentQuestions = questions[assessment.id] ?? [];
            return (
              <article key={assessment.id} className="builder-accordion-item">
                <div className="builder-accordion-heading">
                  <button type="button" className="builder-toggle" onClick={() => toggleExpanded(assessment.id, "assessment")} aria-expanded={expanded}>
                    <span className={`builder-chevron${expanded ? " builder-chevron-open" : ""}`}><Icon name="chevronRight" size={16} /></span>
                    <span className="builder-heading-copy"><strong>{assessment.title}</strong><small>{assessment.description || `${assessmentQuestions.length} questions`}</small></span>
                    <span className="builder-badges"><Badge tone="green">{assessment.passingScore}% pass</Badge><Badge tone="blue">{assessment.maxAttempts} attempts</Badge>{assessment.timeLimitMinutes ? <Badge>{assessment.timeLimitMinutes} min</Badge> : null}</span>
                  </button>
                  <div className="builder-row-actions"><button type="button" className="builder-icon-action" disabled title="Assessment editing is not available in the backend" aria-label={`Edit ${assessment.title}`}><Icon name="edit" size={16} /></button><button type="button" className="builder-icon-action builder-delete" disabled title="Delete is not available in the backend" aria-label={`Delete ${assessment.title}`}><Icon name="trash" size={16} /></button></div>
                </div>
                {expanded ? <div className="builder-children">{assessmentQuestions.length ? assessmentQuestions.map((question) => (
                  <div key={question.id} className="builder-child-row">
                    <Icon name="grip" size={16} />
                    <span className="builder-child-copy"><strong>{question.displayOrder}. {question.questionText}</strong><small>{question.questionType.replaceAll("_", " ")} · {question.points} points</small></span>
                    <div className="builder-row-actions"><button type="button" className="builder-icon-action" disabled title="Question editing is not available in the backend" aria-label={`Edit question ${question.displayOrder}`}><Icon name="edit" size={16} /></button><button type="button" className="builder-icon-action builder-delete" disabled title="Delete is not available in the backend" aria-label={`Delete question ${question.displayOrder}`}><Icon name="trash" size={16} /></button></div>
                  </div>
                )) : <p className="builder-empty-row">No questions in this assessment.</p>}</div> : null}
              </article>
            );
          })}</div>
        )}
      </section>

      <Modal open={activeModal === "module"} title={moduleId ? "Edit module" : "Add module"} onClose={closeModal}>
        <form className="modal-form" onSubmit={saveModule}>
          <Field label="Title"><Input value={moduleTitle} onChange={(event) => setModuleTitle(event.target.value)} required /></Field>
          <Field label="Description"><Textarea value={moduleDescription} onChange={(event) => setModuleDescription(event.target.value)} rows={3} /></Field>
          <Field label="Display order"><Input type="number" min="1" value={moduleOrder} onChange={(event) => setModuleOrder(event.target.value)} required /></Field>
          <label className="checkbox-row"><input type="checkbox" checked={moduleRequired} onChange={(event) => setModuleRequired(event.target.checked)} /><span><strong>Required module</strong></span></label>
          <div className="form-actions"><Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? "Saving..." : moduleId ? "Update module" : "Add module"}</Button></div>
        </form>
      </Modal>

      <Modal open={activeModal === "lesson"} title={lessonId ? "Edit lesson" : "Add lesson"} onClose={closeModal}>
        <form className="modal-form" onSubmit={saveLesson}>
          <Field label="Module"><Select value={lessonModuleId} onChange={(event) => { setLessonModuleId(event.target.value); setLessonId(null); }} required><option value="">Select module</option>{modules.map((module) => <option key={module.id} value={module.id}>{module.title}</option>)}</Select></Field>
          <Field label="Title"><Input value={lessonTitle} onChange={(event) => setLessonTitle(event.target.value)} required /></Field>
          <div className="form-grid"><Field label="Content type"><Select value={lessonType} onChange={(event) => setLessonType(event.target.value)}><option value="text">Text</option><option value="video">Video</option><option value="pdf">PDF</option><option value="link">Link</option></Select></Field><Field label="Display order"><Input type="number" min="1" value={lessonOrder} onChange={(event) => setLessonOrder(event.target.value)} required /></Field></div>
          <Field label="Content URL" hint="Use for video, PDF, or external link content."><Input type="url" value={lessonUrl} onChange={(event) => setLessonUrl(event.target.value)} /></Field>
          <Field label="Text content"><Textarea value={lessonBody} onChange={(event) => setLessonBody(event.target.value)} rows={4} /></Field>
          <div className="form-grid"><Field label="Duration (minutes)"><Input type="number" min="1" value={lessonDuration} onChange={(event) => setLessonDuration(event.target.value)} /></Field><label className="checkbox-row modal-checkbox"><input type="checkbox" checked={lessonRequired} onChange={(event) => setLessonRequired(event.target.checked)} /><span><strong>Required lesson</strong></span></label></div>
          <div className="form-actions"><Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button><Button type="submit" disabled={busy || !modules.length}>{busy ? "Saving..." : lessonId ? "Update lesson" : "Add lesson"}</Button></div>
        </form>
      </Modal>

      <Modal open={activeModal === "assessment"} title="Add assessment" onClose={closeModal}>
        <form className="modal-form" onSubmit={createAssessment}>
          <Field label="Title"><Input value={assessmentTitle} onChange={(event) => setAssessmentTitle(event.target.value)} required /></Field>
          <Field label="Description"><Textarea value={assessmentDescription} onChange={(event) => setAssessmentDescription(event.target.value)} rows={3} /></Field>
          <Field label="Module" hint="Leave blank for a course-level assessment."><Select value={assessmentModuleId} onChange={(event) => setAssessmentModuleId(event.target.value)}><option value="">Course level</option>{modules.map((module) => <option key={module.id} value={module.id}>{module.title}</option>)}</Select></Field>
          <div className="form-grid"><Field label="Passing score"><Input type="number" min="0" max="100" value={passingScore} onChange={(event) => setPassingScore(event.target.value)} required /></Field><Field label="Maximum attempts"><Input type="number" min="1" value={maxAttempts} onChange={(event) => setMaxAttempts(event.target.value)} required /></Field><Field label="Time limit (minutes)"><Input type="number" min="1" value={timeLimit} onChange={(event) => setTimeLimit(event.target.value)} /></Field><Field label="Display order"><Input type="number" min="1" value={assessmentOrder} onChange={(event) => setAssessmentOrder(event.target.value)} required /></Field></div>
          <div className="form-actions"><Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? "Saving..." : "Add assessment"}</Button></div>
        </form>
      </Modal>

      <Modal open={activeModal === "question"} title="Add question" onClose={closeModal}>
        <form className="modal-form" onSubmit={createQuestion}>
          <Field label="Assessment"><Select value={questionAssessmentId} onChange={(event) => setQuestionAssessmentId(event.target.value)} required><option value="">Select assessment</option>{assessments.map((assessment) => <option key={assessment.id} value={assessment.id}>{assessment.title}</option>)}</Select></Field>
          <Field label="Question"><Textarea value={questionText} onChange={(event) => setQuestionText(event.target.value)} rows={3} required /></Field>
          <div className="form-grid"><Field label="Type"><Select value={questionType} onChange={(event) => changeQuestionType(event.target.value as QuestionType)}><option value="single_choice">Single choice</option><option value="multiple_choice">Multiple choice</option><option value="short_answer">Short answer</option></Select></Field><Field label="Points"><Input type="number" min="0.1" step="0.1" value={questionPoints} onChange={(event) => setQuestionPoints(event.target.value)} required /></Field></div>
          {questionType === "short_answer" ? <Field label="Correct answer"><Input value={correctAnswer} onChange={(event) => setCorrectAnswer(event.target.value)} required /></Field> : <div className="option-editor">{options.map((option, index) => <div key={index} className="option-editor-row"><Input value={option.optionText} onChange={(event) => updateOption(index, { optionText: event.target.value })} placeholder={`Option ${index + 1}`} required /><label><input type={questionType === "single_choice" ? "radio" : "checkbox"} name="correct-option" checked={option.isCorrect} onChange={(event) => updateOption(index, { isCorrect: event.target.checked })} /> Correct</label>{options.length > 2 ? <Button type="button" variant="quiet" onClick={() => setOptions((current) => current.filter((_, optionIndex) => optionIndex !== index))}>Remove</Button> : null}</div>)}<Button type="button" variant="secondary" onClick={() => setOptions((current) => [...current, { optionText: "", isCorrect: false }])}>Add option</Button></div>}
          <Field label="Explanation"><Textarea value={explanation} onChange={(event) => setExplanation(event.target.value)} rows={2} /></Field>
          <Field label="Display order"><Input type="number" min="1" value={questionOrder} onChange={(event) => setQuestionOrder(event.target.value)} required /></Field>
          <div className="form-actions"><Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button><Button type="submit" disabled={busy || !assessments.length}>{busy ? "Saving..." : "Add question"}</Button></div>
        </form>
      </Modal>
    </div>
  );
}
