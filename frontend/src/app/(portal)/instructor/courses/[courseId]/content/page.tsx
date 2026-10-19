import { CourseContentManager } from "./course-content-manager";

export default async function CourseContentPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  return <CourseContentManager courseId={Number(courseId)} />;
}
