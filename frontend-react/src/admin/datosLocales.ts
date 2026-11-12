import type { ApiJuego } from "../api/api";
import type { Descuento } from "../utils";
import { enRango } from "./periodo";
import type { Rango } from "./periodo";
import type { EstadoReserva, FilaReserva, ReservaManual } from "./tipos";

const CLAVE = "juegaya-react-reservas"; // clave propia: no pisa los datos del admin HTML original

export function leerReservasManuales(): ReservaManual[] {
  try { const v = JSON.parse(localStorage.getItem(CLAVE) || "[]"); return Array.isArray(v) ? v : []; } catch { return []; }
}
export function guardarReservasManuales(l: ReservaManual[]): boolean {
  try { localStorage.setItem(CLAVE, JSON.stringify(l)); return true; } catch { return false; }
}

// ---------- copia de respaldo (exportar / importar) ----------
export interface AlcanceCopia { tipo: "general" | "periodo"; desde: string | null; hasta: string | null; incluyeJuegosYDescuentos: boolean; }
// reserva de un cliente (servicio Pedidos): viaja en la copia solo como registro, no se vuelve a importar
export interface ReservaClienteCopia { codigo: string; cliente: string; rut: string; juegos: string[]; fecha: string; total: number; estado: EstadoReserva; }
export interface CopiaDatos {
  app: "juegaya"; version: 1; exportadoEn: string;
  alcance?: AlcanceCopia;
  juegos: Pick<ApiJuego, "id" | "nombre" | "categoria" | "precioJornada" | "descripcion" | "imagenUrl" | "capacidad" | "activo">[];
  bloqueosManuales: { juegoId: string; fecha: string }[];
  reservasManuales: ReservaManual[];
  reservasClientes?: ReservaClienteCopia[];
  descuentos: Descuento[];
}

export interface OpcionesCopia { rango: Rango | null; incluirJuegosYDescuentos: boolean; filas: FilaReserva[]; }

/**
 * Arma la copia. Con un rango, solo entran las cosas que tienen fecha dentro del período
 * (reservas manuales, fechas bloqueadas y reservas de clientes); los juegos y descuentos
 * no tienen fecha, así que van completos o no van, según `incluirJuegosYDescuentos`.
 */
export function armarCopia(juegos: ApiJuego[], manuales: ReservaManual[], descuentos: Descuento[], o: OpcionesCopia): CopiaDatos {
  const nombre = (id: string) => juegos.find(j => j.id === id)?.nombre || id;
  return {
    app: "juegaya", version: 1, exportadoEn: new Date().toISOString(),
    alcance: { tipo: o.rango ? "periodo" : "general", desde: o.rango && o.rango.desde > "0000-01-01" ? o.rango.desde : null, hasta: o.rango && o.rango.hasta < "9999-12-31" ? o.rango.hasta : null, incluyeJuegosYDescuentos: o.incluirJuegosYDescuentos },
    juegos: !o.incluirJuegosYDescuentos ? [] : juegos.map(j => ({ id: j.id, nombre: j.nombre, categoria: j.categoria, precioJornada: j.precioJornada, descripcion: j.descripcion, imagenUrl: j.imagenUrl, capacidad: j.capacidad, activo: j.activo })),
    bloqueosManuales: juegos.flatMap(j => j.bloqueos.filter(b => b.reservaId === null && enRango(b.fecha, o.rango)).map(b => ({ juegoId: j.id, fecha: b.fecha }))),
    reservasManuales: manuales.filter(r => enRango(r.fecha, o.rango)),
    reservasClientes: o.filas.filter(f => f.origen === "cliente" && enRango(f.fecha, o.rango)).map(f => ({ codigo: f.codigo, cliente: f.cliente, rut: f.rut, juegos: f.juegoIds.map(nombre), fecha: f.fecha, total: f.total, estado: f.estado })),
    descuentos: o.incluirJuegosYDescuentos ? descuentos : []
  };
}

const ESTADOS_OK: EstadoReserva[] = ["pendiente", "confirmada", "completada", "cancelada"];
const esFecha = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);

// revisa que el archivo tenga la forma esperada; devuelve la copia o lanza un Error con el motivo
export function validarCopia(texto: string): CopiaDatos {
  let d: unknown;
  try { d = JSON.parse(texto); } catch { throw new Error("El archivo no es un JSON válido"); }
  const c = d as Partial<CopiaDatos>;
  if (!c || c.app !== "juegaya" || c.version !== 1) throw new Error("El archivo no es una copia de JuegaYa");
  if (!Array.isArray(c.juegos) || !Array.isArray(c.reservasManuales) || !Array.isArray(c.descuentos) || !Array.isArray(c.bloqueosManuales))
    throw new Error("La copia está incompleta");
  for (const r of c.reservasManuales) {
    if (!r || typeof r.id !== "string" || typeof r.juegoId !== "string" || !esFecha(r.fecha) || !ESTADOS_OK.includes(r.estado) || typeof r.total !== "number" || typeof r.bloqueoId !== "number")
      throw new Error("Hay reservas con datos inválidos en la copia");
  }
  for (const j of c.juegos) if (!j || typeof j.nombre !== "string" || typeof j.precioJornada !== "number") throw new Error("Hay juegos con datos inválidos en la copia");
  for (const b of c.bloqueosManuales) if (!b || !esFecha(b.fecha) || typeof b.juegoId !== "string") throw new Error("Hay bloqueos con datos inválidos en la copia");
  for (const x of c.descuentos) if (!x || typeof x.codigo !== "string" || typeof x.valor !== "number") throw new Error("Hay descuentos con datos inválidos en la copia");
  return c as CopiaDatos;
}
