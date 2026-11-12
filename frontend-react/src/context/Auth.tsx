import { createContext, useContext, useRef, useState } from "react";
import type { ReactNode } from "react";
import { apiUsuarios } from "../api/api";
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
  const aplicar = (s: Sesion) => { guardar(s); setSesion(s); return s; };
  const login = async (email: string, pass: string) => {
    const r = await apiUsuarios.login(email, pass);
    return aplicar(desdeUsuario(r.usuario, r.token));
  };
  // Cierra la sesión local AL INSTANTE (la interfaz no se queda esperando al servidor) y avisa al servidor
  // en segundo plano. Si ya hay un cierre en curso, los clics repetidos se ignoran.
  const cerrando = useRef(false);
  const logout = async () => {
    if (cerrando.current) return;
    cerrando.current = true;
    const token = sesion?.token;
    try { localStorage.removeItem(CLAVE); } catch { /* nada que borrar */ }
    setSesion(null);
    if (token) apiUsuarios.logout(token).catch(() => { /* token vencido o servidor caído: la sesión local ya se cerró */ }).finally(() => { cerrando.current = false; });
    else cerrando.current = false;
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
