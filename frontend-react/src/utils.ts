const f = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
export const clp = (n: number): string => f.format(n);
// Precio por hora redondeado a la centena (ej. $16.668 -> $16.700): así, al cambiar las horas, el total
// (precio por hora x horas) siempre queda redondo y nunca sale algo como $20.002.
export const precioHora = (precioJornada: number): number => Math.max(100, Math.round(precioJornada / 6 / 100) * 100);
export const CATEGORIAS = ["Inflable", "Acuático", "Interior", "Exterior"] as const;
export type CategoriaUI = (typeof CATEGORIAS)[number];
export const aApiCat = (c: CategoriaUI) => ({ Inflable: "INFLABLE", Acuático: "ACUATICO", Interior: "INTERIOR", Exterior: "EXTERIOR" } as const)[c];
export const deApiCat = (c: string): CategoriaUI => (c === "ACUATICO" ? "Acuático" : c === "INTERIOR" ? "Interior" : c === "EXTERIOR" ? "Exterior" : "Inflable");
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
  !d || subtotal <= 0 ? 0 : d.tipo === "porcentaje" ? Math.round((subtotal * d.valor) / 100 / 100) * 100 : d.valor;

// ---- RUT chileno ----
/** Valida el RUT (módulo 11) y lo devuelve como "12345678-5"; devuelve null si no es válido. */
export function normalizarRut(texto: string): string | null {
  const limpio = texto.replace(/[.\-\s]/g, "").toUpperCase();
  if (!/^\d{1,8}[\dK]$/.test(limpio) || limpio.length < 2) return null;
  const cuerpo = limpio.slice(0, -1), dv = limpio.slice(-1);
  let suma = 0, factor = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) { suma += Number(cuerpo[i]) * factor; factor = factor === 7 ? 2 : factor + 1; }
  const resto = 11 - (suma % 11);
  const esperado = resto === 11 ? "0" : resto === 10 ? "K" : String(resto);
  return dv === esperado ? `${Number(cuerpo)}-${dv}` : null;
}
/** "12345678-5" -> "12.345.678-5" para mostrarlo. */
export function formatearRut(rut: string): string {
  const [cuerpo, dv] = rut.split("-");
  return cuerpo ? `${cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}-${dv}` : rut;
}
