const f = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
export const clp = (n: number): string => f.format(n);
export const precioHora = (precioJornada: number): number => Math.round(precioJornada / 6);
export const CATEGORIAS = ["Inflable", "Acuático", "Interior"] as const;
export type CategoriaUI = (typeof CATEGORIAS)[number];
export const aApiCat = (c: CategoriaUI) => ({ Inflable: "INFLABLE", Acuático: "ACUATICO", Interior: "INTERIOR" } as const)[c];
export const deApiCat = (c: string): CategoriaUI => (c === "ACUATICO" ? "Acuático" : c === "INTERIOR" ? "Interior" : "Inflable");
export const COMUNAS: Record<string, number> = { Concepcion: 5000, Talcahuano: 4000, Hualpen: 4500, Chiguayante: 6000, "San Pedro De la Paz": 6000, Penco: 7000 };
export const hoyISO = (): string => new Date().toISOString().slice(0, 10);

export interface Descuento { codigo: string; tipo: "porcentaje" | "fijo"; valor: number; activo: boolean; }
const DESCUENTOS_BASE: Descuento[] = [
  { codigo: "JUEGA10", tipo: "porcentaje", valor: 10, activo: true },
  { codigo: "VERANO5000", tipo: "fijo", valor: 5000, activo: true }
];
// usa los códigos que creó el admin (localStorage "juegaya-admin-v1") o los 2 de fábrica
export const CLAVE_DESCUENTOS = "juegaya-react-descuentos";
export function leerDescuentos(): Descuento[] {
  try {
    const own = JSON.parse(localStorage.getItem(CLAVE_DESCUENTOS) || "null");
    if (Array.isArray(own)) return own as Descuento[];
  } catch { /* sigo con los de fábrica */ }
  return DESCUENTOS_BASE;
}
export function descuentosActivos(): Descuento[] {
  try {
    const own = JSON.parse(localStorage.getItem(CLAVE_DESCUENTOS) || "null");
    if (Array.isArray(own)) return (own as Descuento[]).filter(d => d.activo);
    const admin = JSON.parse(localStorage.getItem("juegaya-admin-v1") || "null");
    if (admin && Array.isArray(admin.descuentos)) return (admin.descuentos as Descuento[]).filter(d => d.activo);
  } catch { /* uso los de fábrica */ }
  return DESCUENTOS_BASE;
}
export const calcularDescuento = (d: Descuento | null, subtotal: number): number =>
  !d || subtotal <= 0 ? 0 : d.tipo === "porcentaje" ? Math.round((subtotal * d.valor) / 100) : d.valor;
