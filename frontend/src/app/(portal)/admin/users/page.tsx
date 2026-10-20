"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge, PageTitle } from "@/components/ui/display";
import { EmptyState, LoadingState } from "@/components/ui/feedback";
import { Pagination } from "@/components/ui/pagination";
import { ToastMessage } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import type { User } from "@/types/api";

const PAGE_SIZE = 10;

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [activeOverrides, setActiveOverrides] = useState<Record<number, boolean>>({});
  const [busyId, setBusyId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    apiFetch<User[]>("/api/admin/users")
      .then(setUsers)
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Could not load users."))
      .finally(() => setLoading(false));
  }, []);

  async function setActive(user: User, active: boolean) {
    setBusyId(user.id);
    setError("");
    try {
      await apiFetch(`/api/admin/users/${user.id}/active?active=${active}`, { method: "PATCH" });
      setActiveOverrides((current) => ({ ...current, [user.id]: active }));
      setSuccess(`${user.firstName} ${user.lastName} was ${active ? "activated" : "deactivated"}.`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not update this user.");
    } finally {
      setBusyId(null);
    }
  }

  const pageCount = Math.max(1, Math.ceil(users.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleUsers = users.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="page-stack">
      <PageTitle title="User management" description="Review accounts and control access. Role assignment is not exposed by the backend." />
      <ToastMessage message={error} type="error" /><ToastMessage message={success} type="success" />
      {loading ? <LoadingState /> : users.length === 0 ? <EmptyState title="No users" message="Registered users will appear here." /> : (
        <div className="table-stack"><div className="table-wrap"><table className="data-table"><thead><tr><th>User</th><th>Email</th><th>Role</th><th>Known status</th><th>Actions</th></tr></thead><tbody>
          {visibleUsers.map((user) => <tr key={user.id}><td><strong>{user.firstName} {user.lastName}</strong><p>ID: {user.id}</p></td><td>{user.email}</td><td><Badge tone="blue">{user.role.replace("_", " ")}</Badge></td><td>{activeOverrides[user.id] === undefined ? <span className="muted-text">Not returned by API</span> : <Badge tone={activeOverrides[user.id] ? "green" : "amber"}>{activeOverrides[user.id] ? "Active" : "Inactive"}</Badge>}</td><td><div className="table-actions"><Button className="button-small" disabled={busyId === user.id || activeOverrides[user.id] === true} onClick={() => setActive(user, true)}>Activate</Button><Button className="button-small" variant="secondary" disabled={busyId === user.id || activeOverrides[user.id] === false} onClick={() => setActive(user, false)}>Deactivate</Button></div></td></tr>)}
        </tbody></table></div><Pagination page={currentPage} totalPages={pageCount} onPageChange={setPage} /></div>
      )}
    </div>
  );
}
