import { CourseDetails } from "./course-details";

export default async function CourseDetailsPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  return <CourseDetails courseId={Number(courseId)} />;
}
