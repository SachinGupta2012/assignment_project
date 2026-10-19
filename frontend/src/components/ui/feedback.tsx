import { Icon } from "./icon";

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="loading-state" role="status">
      <span className="spinner" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return <div className="alert alert-error">{message}</div>;
}

export function SuccessBanner({ message }: { message: string }) {
  return <div className="alert alert-success"><Icon name="check" size={17} />{message}</div>;
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><Icon name="book" size={24} /></div>
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  );
}
