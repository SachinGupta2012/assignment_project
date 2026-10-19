"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { apiFetch } from "@/lib/api";
import type { Notification, PageResponse } from "@/types/api";

export function NotificationMenu({ open, onToggle, onClose }: { open: boolean; onToggle: () => void; onClose: () => void }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    apiFetch<{ unread: number }>("/api/notifications/unread-count")
      .then((data) => { if (active) setUnread(data.unread); })
      .catch(() => { if (active) setUnread(0); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!open) return;
    let active = true;
    Promise.all([
      apiFetch<PageResponse<Notification>>("/api/notifications?size=5&sort=createdAt,desc"),
      apiFetch<{ unread: number }>("/api/notifications/unread-count"),
    ])
      .then(([data, count]) => {
        if (!active) return;
        setNotifications(data.content);
        setUnread(count.unread);
        setError("");
      })
      .catch((requestError) => {
        if (active) setError(requestError instanceof Error ? requestError.message : "Could not load notifications.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [open]);

  async function markRead(notification: Notification) {
    if (notification.isRead) return;
    try {
      const updated = await apiFetch<Notification>(`/api/notifications/${notification.id}/read`, { method: "PATCH" });
      setNotifications((current) => current.map((item) => item.id === updated.id ? updated : item));
      setUnread((current) => Math.max(0, current - 1));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not update notification.");
    }
  }

  async function markAllRead() {
    try {
      await apiFetch("/api/notifications/read-all", { method: "PATCH" });
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
      setUnread(0);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not update notifications.");
    }
  }

  return (
    <div className="notification-menu">
      <button type="button" className="icon-button notification-trigger" aria-label="Notifications" aria-haspopup="menu" aria-expanded={open} onClick={onToggle}>
        <Icon name="bell" size={20} />
        {unread > 0 ? <span className="notification-count">{unread > 99 ? "99+" : unread}</span> : null}
      </button>
      {open ? (
        <div className="notification-dropdown" role="menu">
          <div className="notification-dropdown-header"><strong>Notifications</strong>{unread > 0 ? <button type="button" onClick={markAllRead}>Mark all read</button> : null}</div>
          <div className="notification-dropdown-list">
            {loading ? <p className="notification-dropdown-state">Loading notifications...</p> : error ? <p className="notification-dropdown-state notification-dropdown-error">{error}</p> : notifications.length === 0 ? <p className="notification-dropdown-state">You are all caught up.</p> : notifications.map((notification) => (
              <button key={notification.id} type="button" className={`notification-dropdown-item${notification.isRead ? "" : " notification-dropdown-unread"}`} onClick={() => markRead(notification)}>
                <span className="notification-dot" />
                <span><strong>{notification.title}</strong><small>{notification.message}</small><time>{new Date(notification.createdAt).toLocaleString()}</time></span>
              </button>
            ))}
          </div>
          <Link href="/notifications" className="notification-view-all" onClick={onClose}>View all notifications</Link>
        </div>
      ) : null}
    </div>
  );
}
