"use client";

import { useCallback, useEffect, useState } from "react";
import { RoleGuard } from "@/components/auth/role-guard";
import { Button } from "@/components/ui/button";
import { Badge, PageTitle } from "@/components/ui/display";
import { EmptyState, LoadingState } from "@/components/ui/feedback";
import { ToastMessage } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import type { Notification, PageResponse } from "@/types/api";

export default function NotificationsPage() {
  return <RoleGuard permission="notifications.read"><NotificationsContent /></RoleGuard>;
}

function NotificationsContent() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<PageResponse<Notification>>("/api/notifications?size=50&sort=createdAt,desc");
      setNotifications(data.content);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function markRead(id: number) {
    try {
      const updated = await apiFetch<Notification>(`/api/notifications/${id}/read`, { method: "PATCH" });
      setNotifications((current) => current.map((item) => item.id === id ? updated : item));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not update notification.");
    }
  }

  async function markAllRead() {
    try {
      await apiFetch("/api/notifications/read-all", { method: "PATCH" });
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not update notifications.");
    }
  }

  return (
    <div className="page-stack">
      <PageTitle title="Notifications" description="Updates about enrollments, results, and course activity." action={<Button variant="secondary" onClick={markAllRead}>Mark all as read</Button>} />
      <ToastMessage message={error} type="error" />
      {loading ? <LoadingState /> : notifications.length === 0 ? <EmptyState title="You are all caught up" message="New notifications will appear here." /> : (
        <div className="notification-list">{notifications.map((item) => (
          <article key={item.id} className={`notification-row${item.isRead ? "" : " notification-unread"}`}>
            <div><div className="notification-title"><h2>{item.title}</h2><Badge tone={item.isRead ? "neutral" : "blue"}>{item.type}</Badge></div><p>{item.message}</p><small>{new Date(item.createdAt).toLocaleString()}</small></div>
            {!item.isRead ? <Button className="button-small" variant="secondary" onClick={() => markRead(item.id)}>Mark read</Button> : null}
          </article>
        ))}</div>
      )}
    </div>
  );
}
