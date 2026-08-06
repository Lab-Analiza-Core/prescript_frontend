import { useCallback, useEffect, useReducer, useRef } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, CheckCircle2, Info, X, XCircle } from "lucide-react";

const AUTO_CLOSE_DELAY = 4000;
const EXIT_ANIMATION_DELAY = 260;

const TOAST_LABELS = {
  success: "Exito",
  error: "Error",
  warning: "Advertencia",
  info: "Informacion",
};

const TOAST_ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const TYPE_STYLES = {
  success: {
    border: "border-l-prescript-primary",
    icon: "text-prescript-primary",
    title: "text-prescript-primary",
    progress: "bg-prescript-primary",
  },
  error: {
    border: "border-l-prescript-danger",
    icon: "text-prescript-danger",
    title: "text-prescript-danger",
    progress: "bg-prescript-danger",
  },
  warning: {
    border: "border-l-prescript-warning",
    icon: "text-prescript-warning",
    title: "text-prescript-warning",
    progress: "bg-prescript-warning",
  },
  info: {
    border: "border-l-prescript-accent",
    icon: "text-prescript-accent",
    title: "text-prescript-accent",
    progress: "bg-prescript-accent",
  },
};

function visibilityReducer(state, action) {
  switch (action.type) {
    case "SHOW":
      return { isVisible: true, isLeaving: false };
    case "LEAVING":
      return { ...state, isLeaving: true };
    case "HIDE":
      return { isVisible: false, isLeaving: false };
    default:
      return state;
  }
}

export function ToastNotification({ inline = false, onClose, toast }) {
  const [{ isVisible, isLeaving }, dispatch] = useReducer(visibilityReducer, {
    isVisible: false,
    isLeaving: false,
  });
  const timeoutRef = useRef(null);
  const closeTimeoutRef = useRef(null);
  const isClosingRef = useRef(false);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const handleClose = useCallback(() => {
    if (isClosingRef.current) return;

    isClosingRef.current = true;
    dispatch({ type: "LEAVING" });

    closeTimeoutRef.current = setTimeout(() => {
      dispatch({ type: "HIDE" });
      isClosingRef.current = false;
      onCloseRef.current?.();
    }, EXIT_ANIMATION_DELAY);
  }, []);

  useEffect(() => {
    clearTimers();

    if (!toast.show) {
      isClosingRef.current = false;
      dispatch({ type: "HIDE" });
      return clearTimers;
    }

    isClosingRef.current = false;
    dispatch({ type: "SHOW" });
    timeoutRef.current = setTimeout(handleClose, AUTO_CLOSE_DELAY);

    return clearTimers;
  }, [clearTimers, handleClose, toast.message, toast.show]);

  if (!isVisible) return null;

  const type = toast.type || "info";
  const Icon = TOAST_ICONS[type] || TOAST_ICONS.info;
  const toastLabel = TOAST_LABELS[type] || TOAST_LABELS.info;
  const styles = TYPE_STYLES[type] || TYPE_STYLES.info;
  const wrapperClassName = inline
    ? "w-full pointer-events-none"
    : "fixed top-3 right-3 left-3 z-[9999] pointer-events-none sm:top-[18px] sm:right-[18px] sm:left-auto sm:w-[min(420px,calc(100vw-28px))]";
  const cardClassName = [
    "pointer-events-auto relative grid min-h-[68px] grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 overflow-hidden rounded-prescript border border-l-4 border-prescript-line bg-prescript-surface/95 px-3 py-3 pb-4 text-prescript-ink shadow-[0_18px_46px_rgba(15,23,42,0.16)] transition duration-[260ms] ease-out sm:min-h-[76px] sm:px-3.5 sm:py-3.5 sm:pb-4",
    styles.border,
    isLeaving ? "translate-x-6 scale-[0.98] opacity-0" : "translate-x-0 scale-100 opacity-100",
  ].join(" ");

  const content = (
    <div className={wrapperClassName} role="status" aria-live="polite">
      <div className={cardClassName}>
        <Icon className={`mt-0.5 ${styles.icon}`} size={21} aria-hidden="true" />
        <div className="min-w-0">
          <strong className={`mb-0.5 block text-sm leading-tight ${styles.title}`}>{toastLabel}</strong>
          <p className="m-0 text-[13px] leading-snug text-prescript-muted [overflow-wrap:anywhere]">{toast.message}</p>
        </div>
        <button
          className="grid size-[30px] place-items-center rounded-full border-0 bg-transparent text-prescript-muted hover:bg-prescript-muted-surface hover:text-prescript-ink"
          onClick={handleClose}
          type="button"
          aria-label="Cerrar mensaje"
        >
          <X size={15} aria-hidden="true" />
        </button>
        <span
          className={`absolute inset-x-0 bottom-0 h-[3px] origin-left opacity-60 animate-toast-progress ${styles.progress}`}
          key={toast.message}
        />
      </div>
    </div>
  );

  return inline ? content : createPortal(content, document.body);
}
