"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-provider";
import { hasPermission, type Permission } from "@/lib/permissions";
import { LoadingState } from "@/components/ui/feedback";

export function RoleGuard({ permission, children }: { permission: Permission; children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const allowed = hasPermission(user?.role, permission);

  useEffect(() => {
    if (!loading && user && !allowed) {
      router.replace("/access-denied");
    }
  }, [allowed, loading, router, user]);

  if (loading || !user || !allowed) {
    return <LoadingState label="Checking access..." />;
  }
  return children;
}

export function PermissionGate({ permission, children }: { permission: Permission; children: React.ReactNode }) {
  const { user } = useAuth();
  return hasPermission(user?.role, permission) ? children : null;
}
