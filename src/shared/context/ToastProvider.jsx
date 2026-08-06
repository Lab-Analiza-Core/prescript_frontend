import { useMemo } from "react";

import { ToastNotification } from "../components/ToastNotification";
import { useToastState } from "../hooks/useToastState";
import { ToastContext } from "./toastContextObject";

export function ToastProvider({ children }) {
  const { hideToast, showToast, toast } = useToastState();
  const value = useMemo(
    () => ({
      hideToast,
      showToast,
    }),
    [hideToast, showToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastNotification toast={toast} onClose={hideToast} />
    </ToastContext.Provider>
  );
}
