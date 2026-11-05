import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";

const Ctx = createContext<(m: string) => void>(() => {});
// eslint-disable-next-line react-refresh/only-export-components
export const useAviso = () => useContext(Ctx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState("");
  const aviso = useCallback((m: string) => { setMsg(m); setTimeout(() => setMsg(""), 3500); }, []);
  return (
    <Ctx.Provider value={aviso}>
      {children}
      <div className="toast-container position-fixed bottom-0 end-0 p-3">
        <div className={`toast ${msg ? "show" : ""}`} role="status" aria-live="polite">
          <div className="toast-body d-flex align-items-center gap-2"><i className="bi bi-check-circle-fill text-success"></i><span>{msg}</span></div>
        </div>
      </div>
    </Ctx.Provider>
  );
}
