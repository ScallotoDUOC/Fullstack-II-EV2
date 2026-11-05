import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Descuento } from "../utils";

export interface ItemCarrito { id: string; nombre: string; horas: number; precioHora: number; }
interface CartCtx {
  items: ItemCarrito[]; fecha: string; setFecha: (f: string) => void; comuna: string; setComuna: (c: string) => void;
  agregar: (i: ItemCarrito) => void; quitar: (id: string) => void; cambiarHoras: (id: string, h: number) => void; vaciar: () => void;
  total: number; abierto: boolean; setAbierto: (a: boolean) => void; descuento: Descuento | null; setDescuento: (d: Descuento | null) => void;
}
const Ctx = createContext<CartCtx>(null as unknown as CartCtx);
// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => useContext(Ctx);
const CLAVE = "juegaya_carrito";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ItemCarrito[]>(() => { try { return JSON.parse(localStorage.getItem(CLAVE + "_items") || "[]"); } catch { return []; } });
  const [fecha, setFecha] = useState<string>(() => localStorage.getItem(CLAVE + "_fecha") || "");
  const [comuna, setComuna] = useState<string>(() => localStorage.getItem(CLAVE + "_comuna") || "");
  useEffect(() => { localStorage.setItem(CLAVE + "_comuna", comuna); }, [comuna]);
  useEffect(() => { localStorage.setItem(CLAVE + "_items", JSON.stringify(items)); }, [items]);
  useEffect(() => { localStorage.setItem(CLAVE + "_fecha", fecha); }, [fecha]);
  const [abierto, setAbierto] = useState(false);
  const [descuento, setDescuento] = useState<Descuento | null>(null);
  const agregar = (i: ItemCarrito) => setItems(p => (p.some(x => x.id === i.id) ? p.map(x => (x.id === i.id ? i : x)) : [...p, i]));
  const quitar = (id: string) => setItems(p => p.filter(x => x.id !== id));
  const cambiarHoras = (id: string, h: number) => setItems(p => p.map(x => (x.id === id ? { ...x, horas: h } : x)));
  const total = items.reduce((s, i) => s + i.horas * i.precioHora, 0);
  return <Ctx.Provider value={{ items, fecha, setFecha, comuna, setComuna, agregar, quitar, cambiarHoras, vaciar: () => setItems([]), total, abierto, setAbierto, descuento, setDescuento }}>{children}</Ctx.Provider>;
}
