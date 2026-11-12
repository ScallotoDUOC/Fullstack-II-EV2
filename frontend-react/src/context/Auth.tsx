import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { apiUsuarios, EVENTO_SESION_EXPIRADA } from "../api/api";
import type { ApiPerfilDatos, ApiUsuario } from "../api/api";

export interface Sesion {
  nombre: string; email: string; token: string; usuarioId: number; rol: string;
  rut?: string | null; telefono?: string | null; direccion?: string | null;
}
const CLAVE = "juegaya_sesion";
interface AuthCtx {
  sesion: Sesion | null;
  login: (email: string, pass: string) => Promise<Sesion>;
  logout: () => Promise<void>;
  /** Guarda los datos del perfil en el servidor y actualiza la sesión. */
  actualizarPerfil: (datos: ApiPerfilDatos) => Promise<Sesion>;
  /** Vuelve a pedir los datos del perfil al servidor (por si la sesión guardada es antigua). */
  refrescarPerfil: () => Promise<void>;
}
const Ctx = createContext<AuthCtx>({
  sesion: null, login: async () => ({} as Sesion), logout: async () => {},
  actualizarPerfil: async () => ({} as Sesion), refrescarPerfil: async () => {}
});
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(Ctx);

function leer(): Sesion | null {
  try { return JSON.parse(localStorage.getItem(CLAVE) || "null"); } catch { return null; }
}
function guardar(s: Sesion) { try { localStorage.setItem(CLAVE, JSON.stringify(s)); } catch { /* sin almacenamiento: queda solo en memoria */ } }
const desdeUsuario = (u: ApiUsuario, token: string): Sesion => ({
  nombre: u.nombre, email: u.email, token, usuarioId: u.id, rol: u.rol, rut: u.rut, telefono: u.telefono, direccion: u.direccion
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Sesion | null>(leer);
  // si el JWT venció o fue rechazado (401), se limpia la sesión local y la interfaz vuelve a "sin sesión"
  useEffect(() => {
    const alExpirar = () => {
      try { localStorage.removeItem(CLAVE); } catch { /* nada que borrar */ }
      setSesion(null);
    };
    window.addEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
    return () => window.removeEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
  }, []);
  const aplicar = (s: Sesion) => { guardar(s); setSesion(s); return s; };
  const login = async (email: string, pass: string) => {
    const r = await apiUsuarios.login(email, pass);
    return aplicar(desdeUsuario(r.usuario, r.token));
  };
  const logout = async () => {
    try { if (sesion) await apiUsuarios.logout(sesion.token); } catch { /* token vencido: igual cierro */ }
    try { localStorage.removeItem(CLAVE); } catch { /* nada que borrar */ }
    setSesion(null);
  };
  const actualizarPerfil = async (datos: ApiPerfilDatos) => {
    if (!sesion) throw new Error("Debes iniciar sesión");
    return aplicar(desdeUsuario(await apiUsuarios.actualizarPerfil(sesion.token, datos), sesion.token));
  };
  const refrescarPerfil = async () => {
    if (!sesion) return;
    try { aplicar(desdeUsuario(await apiUsuarios.yo(sesion.token), sesion.token)); } catch { /* sin conexión o token vencido: dejo lo guardado */ }
  };
  return <Ctx.Provider value={{ sesion, login, logout, actualizarPerfil, refrescarPerfil }}>{children}</Ctx.Provider>;
}
