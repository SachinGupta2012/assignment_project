import { RoleGuard } from "@/components/auth/role-guard";

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard permission="course.manage">{children}</RoleGuard>;
}
