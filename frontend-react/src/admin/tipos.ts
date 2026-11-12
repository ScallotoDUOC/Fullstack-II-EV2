import type { ApiJuego, ApiPedido } from "../api/api";

export type EstadoReserva = "pendiente" | "confirmada" | "completada" | "cancelada";
export const ESTADOS: Record<EstadoReserva, string> = { pendiente: "Pendiente", confirmada: "Confirmada", completada: "Completada", cancelada: "Cancelada" };
export const COLOR_ESTADO: Record<EstadoReserva, string> = { pendiente: "warning", confirmada: "success", completada: "primary", cancelada: "secondary" };

// una reserva que crea el administrador a mano (vive en este navegador; su fecha queda bloqueada en el Catálogo)
export interface ReservaManual {
  id: string; codigo: string; cliente: string; rut?: string; telefono: string; juegoId: string;
  fecha: string; horas: number; total: number; estado: EstadoReserva; bloqueoId: number;
}

// un pedido de cliente (viene del servicio Pedidos) junto con el estado de su pago
export interface PedidoConPago { pedido: ApiPedido; pagoId: number | null; pagoEstado: string | null; }

// fila unificada para listar reservas, vengan de donde vengan
export interface FilaReserva {
  key: string; origen: "manual" | "cliente"; codigo: string; cliente: string; rut: string; telefono: string;
  juegoIds: string[]; fecha: string; total: number; estado: EstadoReserva;
  manual?: ReservaManual; pedido?: PedidoConPago;
}

export interface DatosAdmin {
  juegos: ApiJuego[]; pedidos: PedidoConPago[]; manuales: ReservaManual[];
}

// una reserva "ocupa" el juego mientras esté pendiente o confirmada
export const ocupa = (e: EstadoReserva): boolean => e === "pendiente" || e === "confirmada";

export const fechaLarga = (iso: string): string =>
  new Date(iso + "T12:00:00").toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" });

export const ESTADO_PAGO: Record<string, [string, string]> = {
  PENDIENTE: ["Pendiente", "warning"], APROBADO: ["Aprobado", "success"], RECHAZADO: ["Rechazado", "danger"], REEMBOLSADO: ["Reembolsado", "info"]
};

// pasa un pedido de cliente al mismo vocabulario de estados que las reservas manuales
export function filaDePedido(pc: PedidoConPago, hoy: string, usuario?: { nombre: string; rut: string | null; telefono: string | null }): FilaReserva | null {
  const p = pc.pedido;
  if (p.estado === "BORRADOR" || !p.items.length) return null;
  const fechas = p.items.map(i => i.fechaEvento).sort();
  let estado: EstadoReserva = p.estado === "CANCELADO" ? "cancelada" : p.estado === "CONFIRMADO" ? "confirmada" : "pendiente";
  if (estado === "confirmada" && fechas[fechas.length - 1] < hoy) estado = "completada";
  return {
    key: `p${p.id}`, origen: "cliente", codigo: p.codigo || `#${p.id}`, cliente: usuario?.nombre || `Cliente #${p.usuarioId}`, rut: usuario?.rut || "", telefono: usuario?.telefono || "",
    juegoIds: p.items.map(i => i.juegoId), fecha: fechas[0], total: p.total, estado, pedido: pc
  };
}

export function filaDeManual(r: ReservaManual): FilaReserva {
  return { key: `m${r.id}`, origen: "manual", codigo: r.codigo, cliente: r.cliente, rut: r.rut || "", telefono: r.telefono, juegoIds: [r.juegoId], fecha: r.fecha, total: r.total, estado: r.estado, manual: r };
}
