import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Descuento } from "../utils";
import { useAuth } from "./Auth";

export interface ItemCarrito { id: string; nombre: string; horas: number; precioHora: number; }
interface CartCtx {
  items: ItemCarrito[]; fecha: string; setFecha: (f: string) => void; comuna: string; setComuna: (c: string) => void;
  agregar: (i: ItemCarrito) => void; quitar: (id: string) => void; cambiarHoras: (id: string, h: number) => void; vaciar: () => void;
  total: number; abierto: boolean; setAbierto: (a: boolean) => void; descuento: Descuento | null; setDescuento: (d: Descuento | null) => void;
}
const Ctx = createContext<CartCtx>(null as unknown as CartCtx);
// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => useContext(Ctx);

// La reserva (carrito) es de cada usuario: se guarda con la clave del usuario, no una compartida.
// Sin sesión hay un carrito de invitado, que se une al del usuario cuando inicia sesión.
const CLAVE = "juegaya_carrito";
interface Datos { items: ItemCarrito[]; fecha: string; comuna: string; }
const VACIO: Datos = { items: [], fecha: "", comuna: "" };
const claveDe = (usuarioId: number | undefined) => `${CLAVE}_${usuarioId ?? "invitado"}`;

function leer(clave: string): Datos {
  try {
    const d = JSON.parse(localStorage.getItem(clave) || "null");
    return d && Array.isArray(d.items) ? { items: d.items, fecha: d.fecha || "", comuna: d.comuna || "" } : VACIO;
  } catch { return VACIO; }
}
function guardar(clave: string, d: Datos) { try { localStorage.setItem(clave, JSON.stringify(d)); } catch { /* sin almacenamiento */ } }

export function CartProvider({ children }: { children: ReactNode }) {
  const { sesion } = useAuth();
  const clave = claveDe(sesion?.usuarioId);
  const [datos, setDatos] = useState<Datos>(() => leer(clave));
  const [claveActual, setClaveActual] = useState(clave);
  const [abierto, setAbierto] = useState(false);
  const [descuento, setDescuento] = useState<Descuento | null>(null);

  // Cambió el usuario (inicio o cierre de sesión): cargo SU reserva. Se ajusta durante el render para
  // no escribir el carrito de otro usuario bajo esta clave.
  if (claveActual !== clave) {
    setClaveActual(clave);
    let nuevo = leer(clave);
    if (claveActual === claveDe(undefined) && sesion) {
      // venía de invitado: sus juegos pasan al carrito del usuario (sin repetir) y el de invitado se vacía
      const invitado = leer(claveActual);
      nuevo = { items: [...nuevo.items, ...invitado.items.filter(i => !nuevo.items.some(x => x.id === i.id))], fecha: nuevo.fecha || invitado.fecha, comuna: nuevo.comuna || invitado.comuna };
      guardar(claveActual, VACIO);
    }
    setDatos(nuevo); setDescuento(null);
  }
  useEffect(() => { guardar(clave, datos); }, [clave, datos]);
  // el carrito global de versiones anteriores quedó sin dueño: lo borro
  useEffect(() => { try { for (const k of ["_items", "_fecha", "_comuna"]) localStorage.removeItem(CLAVE + k); } catch { /* nada que borrar */ } }, []);

  const { items, fecha, comuna } = datos;
  const cambiar = (c: Partial<Datos>) => setDatos(p => ({ ...p, ...c }));
  const agregar = (i: ItemCarrito) => setDatos(p => ({ ...p, items: p.items.some(x => x.id === i.id) ? p.items.map(x => (x.id === i.id ? i : x)) : [...p.items, i] }));
  const quitar = (id: string) => setDatos(p => ({ ...p, items: p.items.filter(x => x.id !== id) }));
  const cambiarHoras = (id: string, h: number) => setDatos(p => ({ ...p, items: p.items.map(x => (x.id === id ? { ...x, horas: h } : x)) }));
  const total = items.reduce((s, i) => s + i.horas * i.precioHora, 0);
  return <Ctx.Provider value={{ items, fecha, setFecha: f => cambiar({ fecha: f }), comuna, setComuna: c => cambiar({ comuna: c }), agregar, quitar, cambiarHoras, vaciar: () => cambiar({ items: [] }), total, abierto, setAbierto, descuento, setDescuento }}>{children}</Ctx.Provider>;
}
