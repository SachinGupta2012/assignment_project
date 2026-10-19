import { AssessmentView } from "./assessment-view";

export default async function AssessmentPage({ params }: { params: Promise<{ courseId: string; assessmentId: string }> }) {
  const { courseId, assessmentId } = await params;
  return <AssessmentView courseId={Number(courseId)} assessmentId={Number(assessmentId)} />;
}
