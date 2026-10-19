"use client";

import { CSSProperties, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Icon, type IconName } from "./icon";

export type ToastType = "success" | "error" | "warning";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toastDetails: Record<ToastType, { title: string; icon: IconName }> = {
  success: { title: "Success", icon: "check" },
  error: { title: "Error", icon: "error" },
  warning: { title: "Warning", icon: "warning" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const removeToast = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = "success", duration = 3800) => {
    const id = nextId.current++;
    setToasts((current) => [...current, { id, message, type, duration }].slice(-4));
    timers.current.set(id, setTimeout(() => removeToast(id), duration));
  }, [removeToast]);

  useEffect(() => () => {
    timers.current.forEach(clearTimeout);
    timers.current.clear();
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" aria-live="polite" aria-label="Notifications">
        {toasts.map((toast) => {
          const details = toastDetails[toast.type];
          return (
            <div
              key={toast.id}
              className={`toast toast-${toast.type}`}
              role={toast.type === "error" ? "alert" : "status"}
              style={{ "--toast-duration": `${toast.duration}ms` } as CSSProperties}
            >
              <span className="toast-icon"><Icon name={details.icon} size={19} /></span>
              <span className="toast-copy"><strong>{details.title}</strong><span>{toast.message}</span></span>
              <button type="button" className="toast-close" onClick={() => removeToast(toast.id)} aria-label="Close notification"><Icon name="close" size={17} /></button>
              <span className="toast-progress" />
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider.");
  return context;
}

export function ToastMessage({ message, type }: { message: string; type: ToastType }) {
  const { showToast } = useToast();

  useEffect(() => {
    if (message) showToast(message, type);
  }, [message, showToast, type]);

  return null;
}
