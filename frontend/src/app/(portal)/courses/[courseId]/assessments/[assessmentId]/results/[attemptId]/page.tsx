import { ResultView } from "./result-view";

export default async function ResultPage({ params }: { params: Promise<{ courseId: string; assessmentId: string; attemptId: string }> }) {
  const { courseId, assessmentId, attemptId } = await params;
  return <ResultView courseId={Number(courseId)} assessmentId={Number(assessmentId)} attemptId={Number(attemptId)} />;
}
