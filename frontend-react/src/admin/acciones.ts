import { apiCatalogo, apiPagos, apiPedidos } from "../api/api";
import type { ApiJuego } from "../api/api";
import { precioHora } from "../utils";
import { fechaLarga, ocupa } from "./tipos";
import type { FilaReserva, PedidoConPago, ReservaManual } from "./tipos";

const idBloqueo = (): number => 1_000_000_000 + Math.floor(Math.random() * 1_000_000_000); // no choca con ids de pedidos
const codigo = (): string => "JY-" + Math.random().toString(36).slice(2, 7).toUpperCase();

// ¿ese juego ya está ocupado ese día? (bloqueo en el Catálogo o reserva activa que ya conozco)
export function motivoOcupado(juego: ApiJuego, fecha: string, filas: FilaReserva[], ignorarKey?: string): string | null {
  if (juego.bloqueos.some(b => b.fecha === fecha)) return `“${juego.nombre}” ya está ocupado el ${fechaLarga(fecha)}`;
  const choque = filas.some(f => f.key !== ignorarKey && ocupa(f.estado) && f.fecha === fecha && f.juegoIds.includes(juego.id));
  return choque ? `“${juego.nombre}” ya tiene una reserva el ${fechaLarga(fecha)}` : null;
}

// ---------- reservas manuales ----------
export interface DatosReservaManual { cliente: string; rut?: string; telefono: string; juegoId: string; fecha: string; horas: number; }

export async function crearReservaManual(d: DatosReservaManual, filas: FilaReserva[]): Promise<ReservaManual> {
  const juegos = await apiCatalogo.listarTodos(); // datos frescos: otro cliente pudo reservar recién
  const juego = juegos.find(j => j.id === d.juegoId);
  if (!juego || !juego.activo) throw new Error("Ese juego no está disponible");
  if (!(d.horas >= 1 && d.horas <= 6)) throw new Error("Las horas deben estar entre 1 y 6");
  const motivo = motivoOcupado(juego, d.fecha, filas);
  if (motivo) throw new Error(motivo);
  const bloqueoId = idBloqueo();
  await apiCatalogo.bloquear(juego.id, d.fecha, bloqueoId); // el Catálogo también rechaza (409) si ya estaba ocupado
  return { id: crypto.randomUUID(), codigo: codigo(), cliente: d.cliente, rut: d.rut || undefined, telefono: d.telefono, juegoId: juego.id, fecha: d.fecha, horas: d.horas, total: precioHora(juego.precioJornada) * d.horas, estado: "pendiente", bloqueoId };
}

export async function cambiarEstadoManual(r: ReservaManual, nuevo: ReservaManual["estado"], juegos: ApiJuego[], filas: FilaReserva[]): Promise<ReservaManual> {
  if (ocupa(nuevo) && !ocupa(r.estado)) {
    const juego = juegos.find(j => j.id === r.juegoId);
    if (!juego) throw new Error("El juego de esta reserva ya no existe");
    const motivo = motivoOcupado(juego, r.fecha, filas, `m${r.id}`);
    if (motivo) throw new Error(motivo);
    await apiCatalogo.bloquear(r.juegoId, r.fecha, r.bloqueoId);
  } else if (!ocupa(nuevo) && ocupa(r.estado)) {
    await apiCatalogo.liberar(r.bloqueoId);
  }
  return { ...r, estado: nuevo };
}

export async function eliminarManual(r: ReservaManual): Promise<void> {
  if (ocupa(r.estado)) await apiCatalogo.liberar(r.bloqueoId);
}

// ---------- pedidos de clientes y pagos ----------
export async function cancelarPedido(pc: PedidoConPago): Promise<void> {
  await apiPedidos.cancelar(pc.pedido.id);
  try { await apiCatalogo.liberar(pc.pedido.id); } catch { /* el pedido no tenía bloqueos */ }
  if (pc.pagoId !== null && pc.pagoEstado === "APROBADO") await apiPagos.reembolsar(pc.pagoId);
}

export async function confirmarPago(pc: PedidoConPago): Promise<void> {
  if (pc.pagoId === null) throw new Error("Este pedido no tiene un pago registrado");
  await apiPagos.confirmar(pc.pagoId);
  await apiPedidos.pagado(pc.pedido.id);
}

export async function reembolsarPago(pc: PedidoConPago): Promise<void> {
  if (pc.pagoId === null) throw new Error("Este pedido no tiene un pago registrado");
  await apiPagos.reembolsar(pc.pagoId);
}

// El servicio Pedidos no tiene "listar todos", así que recorro los ids 1, 2, 3... hasta encontrar 4 seguidos que no existen.
export async function cargarPedidos(): Promise<PedidoConPago[]> {
  const res: PedidoConPago[] = [];
  let fallos = 0;
  for (let id = 1; id <= 500 && fallos < 4; id++) {
    try {
      const pedido = await apiPedidos.obtener(id);
      fallos = 0;
      let pagoId: number | null = null, pagoEstado: string | null = null;
      if (pedido.estado !== "BORRADOR") {
        try { const e = await apiPagos.estadoDePedido(id); pagoId = e.pagoId; pagoEstado = e.estado; } catch { /* sin pago */ }
      }
      res.push({ pedido, pagoId, pagoEstado });
    } catch (e) {
      if ((e as Error).message.startsWith("No se pudo conectar")) throw e;
      fallos++;
    }
  }
  return res;
}
