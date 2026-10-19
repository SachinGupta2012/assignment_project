import type { Role } from "@/types/api";

export type Permission =
  | "assessment.attempt"
  | "content.manage"
  | "course.enroll"
  | "course.manage"
  | "course.read"
  | "enrollment.manage"
  | "grading.manage"
  | "lesson.complete"
  | "myCourses.read"
  | "notifications.read"
  | "reports.read"
  | "results.read"
  | "users.manage";

const rolePermissions: Record<Role, Permission[]> = {
  ADMIN: [
    "assessment.attempt", "content.manage", "course.enroll", "course.manage", "course.read",
    "enrollment.manage", "grading.manage", "lesson.complete", "myCourses.read", "notifications.read",
    "reports.read", "results.read", "users.manage",
  ],
  TRAINING_MANAGER: ["course.read", "enrollment.manage", "notifications.read", "reports.read"],
  INSTRUCTOR: ["content.manage", "course.manage", "course.read", "grading.manage", "myCourses.read", "notifications.read"],
  LEARNER: ["assessment.attempt", "course.enroll", "course.read", "lesson.complete", "myCourses.read", "notifications.read", "results.read"],
};

export function hasPermission(role: Role | undefined, permission: Permission) {
  return role ? rolePermissions[role].includes(permission) : false;
}
