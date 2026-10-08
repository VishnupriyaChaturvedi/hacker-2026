import { createContext, useCallback, useContext, useRef, useState } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);
  const timer = useRef(null);

  const show = useCallback((msg) => {
    setMessage(msg);
    setVisible(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setVisible(false), 2200);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className={`toast ${visible ? "show" : ""}`} role="status" aria-live="polite">
        {message}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
