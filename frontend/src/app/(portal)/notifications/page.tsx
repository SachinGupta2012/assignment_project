"use client";

import { useEffect, useState } from "react";
import { RoleGuard } from "@/components/auth/role-guard";
import { Button } from "@/components/ui/button";
import { Badge, PageTitle } from "@/components/ui/display";
import { EmptyState, LoadingState } from "@/components/ui/feedback";
import { Pagination } from "@/components/ui/pagination";
import { ToastMessage } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import type { Notification, PageResponse } from "@/types/api";

export default function NotificationsPage() {
  return <RoleGuard permission="notifications.read"><NotificationsContent /></RoleGuard>;
}

function NotificationsContent() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    apiFetch<PageResponse<Notification>>(`/api/notifications?page=${page}&size=10&sort=createdAt,desc`)
      .then((data) => {
        if (!active) return;
        setNotifications(data.content);
        setTotalPages(Math.max(1, data.totalPages));
      })
      .catch((requestError) => {
        if (active) setError(requestError instanceof Error ? requestError.message : "Could not load notifications.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page]);

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

  function changePage(nextPage: number) {
    setLoading(true);
    setError("");
    setPage(nextPage - 1);
  }

  return (
    <div className="page-stack">
      <PageTitle title="Notifications" description="Updates about enrollments, results, and course activity." action={<Button variant="secondary" onClick={markAllRead}>Mark all as read</Button>} />
      <ToastMessage message={error} type="error" />
      {loading ? <LoadingState /> : notifications.length === 0 ? <EmptyState title="You are all caught up" message="New notifications will appear here." /> : (
        <div className="table-stack">
          <div className="table-wrap"><table className="data-table notification-table">
            <thead><tr><th>Notification</th><th>Type</th><th>Date and time</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>{notifications.map((item) => <tr key={item.id} className={item.isRead ? "" : "notification-unread"}>
              <td><strong>{item.title}</strong><p>{item.message}</p></td>
              <td><Badge tone="blue">{item.type}</Badge></td>
              <td>{new Date(item.createdAt).toLocaleString()}</td>
              <td><Badge tone={item.isRead ? "neutral" : "amber"}>{item.isRead ? "Read" : "Unread"}</Badge></td>
              <td>{!item.isRead ? <Button className="button-small" variant="secondary" onClick={() => markRead(item.id)}>Mark read</Button> : <span className="muted-text">—</span>}</td>
            </tr>)}</tbody>
          </table></div>
          <Pagination page={page + 1} totalPages={totalPages} disabled={loading} onPageChange={changePage} />
        </div>
      )}
    </div>
  );
}
