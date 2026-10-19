import { RoleGuard } from "@/components/auth/role-guard";

export default function ManagementLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard permission="enrollment.manage">{children}</RoleGuard>;
}
