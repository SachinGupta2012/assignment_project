"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { Icon } from "@/components/ui/icon";
import { LoadingState } from "@/components/ui/feedback";
import { NotificationMenu } from "./notification-menu";
import { Sidebar } from "./sidebar";

const roleLabels = {
  ADMIN: "Administrator",
  TRAINING_MANAGER: "Training Manager",
  INSTRUCTOR: "Instructor",
  LEARNER: "Learner",
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<"notifications" | "profile" | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const profileOpen = openMenu === "profile";

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, router, user]);

  useEffect(() => {
    if (!openMenu) return;

    function closeMenu(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenMenu(null);
    }

    document.addEventListener("mousedown", closeMenu);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeMenu);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [openMenu]);

  if (loading || !user) {
    return <div className="full-page-state"><LoadingState label="Preparing your workspace..." /></div>;
  }

  function handleLogout() {
    setOpenMenu(null);
    logout();
    router.replace("/login");
  }

  return (
    <div className="app-shell">
      <Sidebar role={user.role} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-main">
        <header className="topbar">
          <button className="icon-button mobile-only" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Icon name="menu" /></button>
          <div className="topbar-actions" ref={menuRef}>
            <NotificationMenu open={openMenu === "notifications"} onToggle={() => setOpenMenu((current) => current === "notifications" ? null : "notifications")} onClose={() => setOpenMenu(null)} />
            <div className="profile-menu">
            <button
              className="profile-trigger"
              type="button"
              aria-haspopup="menu"
              aria-expanded={profileOpen}
              onClick={() => setOpenMenu((current) => current === "profile" ? null : "profile")}
            >
              <span className="avatar">{user.firstName.charAt(0)}{user.lastName.charAt(0)}</span>
              <span className="user-copy"><strong>{user.firstName} {user.lastName}</strong><small>{roleLabels[user.role]}</small></span>
              <span className={`profile-chevron${profileOpen ? " profile-chevron-open" : ""}`}><Icon name="chevronDown" size={15} /></span>
            </button>
            {profileOpen ? (
              <div className="profile-dropdown" role="menu">
                <button type="button" role="menuitem" onClick={handleLogout}><Icon name="logout" size={18} />Logout</button>
              </div>
            ) : null}
            </div>
          </div>
        </header>
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
