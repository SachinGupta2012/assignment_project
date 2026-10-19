import Link from "next/link";

export default function AccessDeniedPage() {
  return (
    <div className="access-denied">
      <span>403</span>
      <h1>Access denied</h1>
      <p>Your account does not have permission to open this page.</p>
      <Link href="/dashboard" className="button button-primary">Back to dashboard</Link>
    </div>
  );
}
