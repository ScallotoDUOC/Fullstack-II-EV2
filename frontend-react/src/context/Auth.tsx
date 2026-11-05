import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { apiUsuarios } from "../api/api";

export interface Sesion { nombre: string; email: string; token: string; usuarioId: number; rol: string; }
const CLAVE = "juegaya_sesion";
interface AuthCtx { sesion: Sesion | null; login: (email: string, pass: string) => Promise<Sesion>; logout: () => Promise<void>; }
const Ctx = createContext<AuthCtx>({ sesion: null, login: async () => ({} as Sesion), logout: async () => {} });
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(Ctx);

function leer(): Sesion | null {
  try { return JSON.parse(localStorage.getItem(CLAVE) || "null"); } catch { return null; }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Sesion | null>(leer);
  const login = async (email: string, pass: string) => {
    const r = await apiUsuarios.login(email, pass);
    const s: Sesion = { nombre: r.usuario.nombre, email: r.usuario.email, token: r.token, usuarioId: r.usuario.id, rol: r.usuario.rol };
    localStorage.setItem(CLAVE, JSON.stringify(s));
    setSesion(s);
    return s;
  };
  const logout = async () => {
    try { if (sesion) await apiUsuarios.logout(sesion.token); } catch { /* token vencido: igual cierro */ }
    localStorage.removeItem(CLAVE);
    setSesion(null);
  };
  return <Ctx.Provider value={{ sesion, login, logout }}>{children}</Ctx.Provider>;
}
