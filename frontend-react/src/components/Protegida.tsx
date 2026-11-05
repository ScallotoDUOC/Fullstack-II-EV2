import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context/Auth";

export default function Protegida({ children, admin }: { children: ReactNode; admin?: boolean }) {
  const { sesion } = useAuth();
  if (!sesion) return <Navigate to="/iniciar-sesion" replace />;
  if (admin && sesion.rol !== "ADMINISTRADOR") return <Navigate to="/" replace />;
  return <>{children}</>;
}
