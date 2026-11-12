import type { ApiJuego } from "../api/api";
import { deApiCat } from "../utils";
import { ESTADOS, fechaLarga } from "./tipos";
import type { FilaReserva } from "./tipos";

// ---------- búsqueda de reservas ----------
export type CampoBusqueda = "todo" | "rut" | "nombre" | "juego" | "fecha" | "precio" | "estado";
export const CAMPOS_BUSQUEDA: [CampoBusqueda, string][] = [
  ["todo", "Todos los campos"], ["rut", "RUT"], ["nombre", "Nombre"], ["juego", "Juego"], ["fecha", "Fecha"], ["precio", "Precio"], ["estado", "Estado"]
];

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const soloRut = (s: string) => s.replace(/[.\-\s]/g, "").toUpperCase();

function coincidePrecio(total: number, texto: string): boolean {
  // admite "90000", "90.000", "$90.000", ">50000", "<=120000"
  const m = texto.trim().match(/^(<=|>=|<|>)?\s*\$?\s*([\d.]+)$/);
  if (!m) return false;
  const n = Number(m[2].replace(/\./g, ""));
  if (Number.isNaN(n)) return false;
  switch (m[1]) {
    case ">": return total > n; case ">=": return total >= n;
    case "<": return total < n; case "<=": return total <= n;
    default: return String(total).includes(String(n));
  }
}

function coincideFecha(fecha: string, texto: string): boolean {
  const [a, m, d] = fecha.split("-");
  const candidatos = [fecha, `${d}-${m}-${a}`, `${d}/${m}/${a}`, `${Number(d)}/${Number(m)}/${a}`, norm(fechaLarga(fecha))];
  const q = norm(texto);
  return candidatos.some(c => norm(c).includes(q));
}

/** ¿La reserva coincide con lo escrito en el buscador (en el campo elegido)? Un texto vacío deja pasar todo. */
export function coincideBusqueda(f: FilaReserva, campo: CampoBusqueda, texto: string, nombreJuego: (id: string) => string): boolean {
  const q = texto.trim();
  if (!q) return true;
  const por: Record<Exclude<CampoBusqueda, "todo">, () => boolean> = {
    rut: () => !!f.rut && soloRut(f.rut).includes(soloRut(q)),
    nombre: () => norm(f.cliente).includes(norm(q)),
    juego: () => f.juegoIds.some(id => norm(nombreJuego(id)).includes(norm(q))),
    fecha: () => coincideFecha(f.fecha, q),
    precio: () => coincidePrecio(f.total, q),
    estado: () => norm(ESTADOS[f.estado]).includes(norm(q))
  };
  return campo === "todo" ? Object.values(por).some(fn => fn()) : por[campo]();
}

// ---------- orden y filtros de juegos ----------
export type OrdenJuegos = "nombre" | "precio";
export interface FiltroJuegos { orden: OrdenJuegos; asc: boolean; categoria: string; estado: "" | "visible" | "oculto"; }
export const FILTRO_JUEGOS_INICIAL: FiltroJuegos = { orden: "nombre", asc: true, categoria: "", estado: "" };

export function filtrarYOrdenarJuegos(juegos: ApiJuego[], f: FiltroJuegos): ApiJuego[] {
  const lista = juegos.filter(j => (!f.categoria || deApiCat(j.categoria) === f.categoria) && (!f.estado || (f.estado === "visible") === j.activo));
  const signo = f.asc ? 1 : -1;
  return [...lista].sort((a, b) => signo * (f.orden === "precio" ? a.precioJornada - b.precioJornada || a.nombre.localeCompare(b.nombre, "es") : a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" })));
}
