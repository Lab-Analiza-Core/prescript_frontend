import { useCallback, useState } from "react";

export function useToastState() {
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "info",
  });

  const showToast = useCallback((message, type = "info") => {
    setToast({
      show: true,
      message,
      type,
    });
  }, []);

  const hideToast = useCallback(() => {
    setToast({
      show: false,
      message: "",
      type: "info",
    });
  }, []);

  return {
    toast,
    showToast,
    hideToast,
  };
}
