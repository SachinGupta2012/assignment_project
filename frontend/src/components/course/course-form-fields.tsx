import { Field, Input, Select, Textarea } from "@/components/ui/form-field";

export interface CourseFormValues {
  title: string;
  description: string;
  level: string;
  duration: string;
  enrollmentMode: string;
  tags: string;
}

interface CourseFormFieldsProps {
  values: CourseFormValues;
  onChange: (values: CourseFormValues) => void;
}

export function CourseFormFields({ values, onChange }: CourseFormFieldsProps) {
  function update(field: keyof CourseFormValues, value: string) {
    onChange({ ...values, [field]: value });
  }

  return (
    <>
      <Field label="Course title"><Input value={values.title} onChange={(event) => update("title", event.target.value)} placeholder="Enter course title" maxLength={500} required /></Field>
      <Field label="Description"><Textarea value={values.description} onChange={(event) => update("description", event.target.value)} placeholder="What will learners gain from this course?" rows={5} /></Field>
      <div className="form-grid">
        <Field label="Level"><Select value={values.level} onChange={(event) => update("level", event.target.value)}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></Select></Field>
        <Field label="Estimated duration (minutes)"><Input type="number" min="1" value={values.duration} onChange={(event) => update("duration", event.target.value)} required /></Field>
      </div>
      <div className="form-grid">
        <Field label="Enrollment mode"><Select value={values.enrollmentMode} onChange={(event) => update("enrollmentMode", event.target.value)}><option value="self_enroll">Self enrollment</option><option value="manager_assignment">Manager assignment</option></Select></Field>
        <Field label="Tags" hint="Separate tags with commas."><Input value={values.tags} onChange={(event) => update("tags", event.target.value)} placeholder="java, programming" /></Field>
      </div>
    </>
  );
}
