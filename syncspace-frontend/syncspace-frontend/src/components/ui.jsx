import { useEffect } from "react";
import { create } from "zustand";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { colorFor, initials } from "../lib/utils";

export const useToasts = create((set) => ({
  toasts: [],
  push: (type, message) => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { id, type, message }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4200);
  },
}));
export const toast = {
  success: (m) => useToasts.getState().push("success", m),
  error: (m) => useToasts.getState().push("error", m),
  info: (m) => useToasts.getState().push("info", m),
};

export function Toaster() {
  const toasts = useToasts((s) => s.toasts);
  const icons = { success: CheckCircle2, error: AlertCircle, info: Info };
  return (
    <div className="toaster" role="status" aria-live="polite">
      {toasts.map((t) => {
        const Icon = icons[t.type];
        return (
          <div key={t.id} className={`toast ${t.type}`}>
            <Icon size={16} />
            <span>{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}

export function Avatar({ name = "?", id, size = 30, ring }) {
  const c = colorFor(id || name);
  return (
    <span
      className="avatar"
      title={name}
      style={{ width: size, height: size, background: c, fontSize: size * 0.38, boxShadow: ring ? `0 0 0 2px #fff, 0 0 0 4px ${c}` : undefined }}
    >
      {initials(name)}
    </span>
  );
}

export function Modal({ title, onClose, children, footer, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? "wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export const Spinner = ({ label = "Loading" }) => (
  <div className="center-fill"><div className="spinner" aria-label={label} /></div>
);

export const EmptyState = ({ icon: Icon, title, text, action }) => (
  <div className="empty">
    {Icon && <Icon size={28} strokeWidth={1.5} />}
    <h4>{title}</h4>
    {text && <p>{text}</p>}
    {action}
  </div>
);
