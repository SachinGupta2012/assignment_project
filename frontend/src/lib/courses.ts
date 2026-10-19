import { apiFetch } from "./api";
import type { CourseModule, Lesson } from "@/types/api";

export interface ModuleWithLessons extends CourseModule {
  lessons: Lesson[];
}

export async function getCourseContent(courseId: number): Promise<ModuleWithLessons[]> {
  const modules = await apiFetch<CourseModule[]>(`/api/courses/${courseId}/modules`);
  const withLessons = await Promise.all(modules.map(async (module) => ({
    ...module,
    lessons: await apiFetch<Lesson[]>(`/api/courses/${courseId}/modules/${module.id}/lessons`),
  })));
  return withLessons.sort((a, b) => a.displayOrder - b.displayOrder);
}
