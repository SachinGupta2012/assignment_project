import { Icon, type IconName } from "./icon";

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "blue" | "green" | "amber" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function ProgressBar({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className="progress-track" aria-label={`${safeValue}% complete`}>
      <span className="progress-fill" style={{ width: `${safeValue}%` }} />
    </div>
  );
}

export function StatCard({ label, value, icon, tone }: { label: string; value: number; icon: IconName; tone: "blue" | "green" | "amber" }) {
  return (
    <div className="stat-card">
      <span className={`stat-icon stat-${tone}`}><Icon name={icon} /></span>
      <span><strong>{value}</strong><small>{label}</small></span>
    </div>
  );
}

export function PageTitle({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="page-title">
      <div><h1>{title}</h1>{description ? <p>{description}</p> : null}</div>
      {action}
    </div>
  );
}
