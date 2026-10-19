"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/types/api";
import { hasPermission, type Permission } from "@/lib/permissions";
import { Brand } from "./brand";
import { Icon, type IconName } from "@/components/ui/icon";

interface SidebarProps {
  role: Role;
  open: boolean;
  onClose: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  permission?: Permission;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard", permission: "course.read" },
  { href: "/my-courses", label: "My Courses", icon: "book", permission: "myCourses.read" },
  { href: "/courses", label: "Catalog", icon: "search", permission: "course.read" },
  { href: "/results", label: "Results", icon: "results", permission: "results.read" },
  { href: "/instructor/courses/new", label: "Create Course", icon: "plus", permission: "course.manage" },
  { href: "/instructor/grading", label: "Grading", icon: "results", permission: "grading.manage" },
  { href: "/management/enrollments", label: "Enrollments", icon: "user", permission: "enrollment.manage" },
  { href: "/management/reports", label: "Reports", icon: "results", permission: "reports.read" },
  { href: "/admin/users", label: "Users", icon: "user", permission: "users.manage" },
  { href: "/notifications", label: "Notifications", icon: "book", permission: "notifications.read" },
];

export function Sidebar({ role, open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {open ? <button className="sidebar-backdrop" aria-label="Close navigation" onClick={onClose} /> : null}
      <aside className={`sidebar${open ? " sidebar-open" : ""}`}>
        <div className="sidebar-brand-row">
          <Brand />
          <button className="icon-button mobile-only" onClick={onClose} aria-label="Close navigation"><Icon name="close" /></button>
        </div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          {navItems.filter((item) => !item.permission || hasPermission(role, item.permission)).map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
            return (
              <Link key={item.href} href={item.href} className={`nav-link${active ? " nav-link-active" : ""}`} onClick={onClose}>
                <Icon name={item.icon} size={17} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
