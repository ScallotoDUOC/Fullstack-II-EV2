import type { FilaReserva } from "./tipos";

// ---------- períodos de tiempo para el resumen y la copia de datos ----------
export type ModoPeriodo = "todo" | "anio" | "mes" | "semana" | "dia" | "rango";
export interface Periodo { modo: ModoPeriodo; anio: number; mes: number; dia: string; desde: string; hasta: string; }
export interface Rango { desde: string; hasta: string; }

export const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const pad = (n: number) => String(n).padStart(2, "0");
const aISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const deISO = (s: string) => new Date(s + "T12:00:00");
const sumarDias = (s: string, n: number) => { const d = deISO(s); d.setDate(d.getDate() + n); return aISO(d); };
const diasEntre = (a: string, b: string) => Math.round((deISO(b).getTime() - deISO(a).getTime()) / 86_400_000);
const corta = (s: string) => deISO(s).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" });

export function periodoInicial(hoy: string): Periodo {
  return { modo: "todo", anio: Number(hoy.slice(0, 4)), mes: Number(hoy.slice(5, 7)), dia: hoy, desde: "", hasta: "" };
}

/** Rango de fechas (ambas incluidas) que cubre el período; null significa "todo el tiempo". Un extremo vacío queda abierto. */
export function rangoDe(p: Periodo): Rango | null {
  switch (p.modo) {
    case "todo": return null;
    case "anio": return { desde: `${p.anio}-01-01`, hasta: `${p.anio}-12-31` };
    case "mes": {
      const ultimo = new Date(p.anio, p.mes, 0).getDate();
      return { desde: `${p.anio}-${pad(p.mes)}-01`, hasta: `${p.anio}-${pad(p.mes)}-${pad(ultimo)}` };
    }
    case "semana": {
      if (!p.dia) return null;
      const dow = (deISO(p.dia).getDay() + 6) % 7; // lunes = 0
      const lunes = sumarDias(p.dia, -dow);
      return { desde: lunes, hasta: sumarDias(lunes, 6) };
    }
    case "dia": return p.dia ? { desde: p.dia, hasta: p.dia } : null;
    case "rango": {
      const d = p.desde || "0000-01-01", h = p.hasta || "9999-12-31";
      return d <= h ? { desde: d, hasta: h } : { desde: h, hasta: d };
    }
  }
}

export const enRango = (fecha: string, r: Rango | null): boolean => !r || (fecha >= r.desde && fecha <= r.hasta);

export function etiquetaPeriodo(p: Periodo): string {
  const r = rangoDe(p);
  switch (p.modo) {
    case "todo": return "Todo el tiempo";
    case "anio": return `Año ${p.anio}`;
    case "mes": return `${MESES[p.mes - 1][0].toUpperCase()}${MESES[p.mes - 1].slice(1)} de ${p.anio}`;
    case "semana": return r ? `Semana del ${corta(r.desde)} al ${corta(r.hasta)}` : "Semana";
    case "dia": return p.dia ? corta(p.dia) : "Día";
    case "rango": return !p.desde && !p.hasta ? "Todo el tiempo" : `${p.desde ? "Desde el " + corta(p.desde) : "Hasta el " + corta(p.hasta)}${p.desde && p.hasta ? " hasta el " + corta(p.hasta) : ""}`;
  }
}

// ---------- desglose del resumen ----------
export interface Tramo { clave: string; etiqueta: string; reservas: number; ingresos: number; }
const cuenta = (f: FilaReserva) => f.estado !== "cancelada";
const paga = (f: FilaReserva) => f.estado === "confirmada" || f.estado === "completada";

/** Agrupa las reservas por día, mes o año según lo largo que sea el período. */
export function desglosar(filas: FilaReserva[], r: Rango | null): { unidad: "día" | "mes" | "año"; tramos: Tramo[] } {
  const validas = filas.filter(cuenta);
  if (!validas.length) return { unidad: "mes", tramos: [] };
  const desde = r && r.desde > "0000-01-01" ? r.desde : validas.reduce((m, f) => (f.fecha < m ? f.fecha : m), validas[0].fecha);
  const hasta = r && r.hasta < "9999-12-31" ? r.hasta : validas.reduce((m, f) => (f.fecha > m ? f.fecha : m), validas[0].fecha);
  const dias = diasEntre(desde, hasta) + 1;
  const unidad: "día" | "mes" | "año" = dias <= 62 ? "día" : dias <= 366 * 3 ? "mes" : "año";
  const clave = (f: string) => (unidad === "día" ? f : unidad === "mes" ? f.slice(0, 7) : f.slice(0, 4));
  const etiqueta = (c: string) => unidad === "día" ? corta(c) : unidad === "mes" ? `${MESES[Number(c.slice(5)) - 1].slice(0, 3)} ${c.slice(0, 4)}` : c;
  const mapa = new Map<string, Tramo>();
  // genero todos los tramos del rango para que se vean también los vacíos (si no son demasiados)
  const claves: string[] = [];
  if (unidad === "día") for (let d = desde; d <= hasta; d = sumarDias(d, 1)) claves.push(d);
  else if (unidad === "mes") { let y = Number(desde.slice(0, 4)), m = Number(desde.slice(5, 7)); while (`${y}-${pad(m)}` <= hasta.slice(0, 7)) { claves.push(`${y}-${pad(m)}`); if (++m > 12) { m = 1; y++; } } }
  else for (let y = Number(desde.slice(0, 4)); y <= Number(hasta.slice(0, 4)); y++) claves.push(String(y));
  for (const c of claves) mapa.set(c, { clave: c, etiqueta: etiqueta(c), reservas: 0, ingresos: 0 });
  for (const f of validas) {
    const t = mapa.get(clave(f.fecha)); if (!t) continue;
    t.reservas++; if (paga(f)) t.ingresos += f.total;
  }
  const todos = [...mapa.values()];
  return { unidad, tramos: todos.length > 12 ? todos.filter(t => t.reservas > 0) : todos };
}
