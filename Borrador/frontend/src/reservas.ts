
import { apiCatalogo, apiPagos, apiPedidos, apiUsuarios } from "./api";
import type { ApiEstadoPago, ApiPedido } from "./api";

(() => {
  "use strict";


  const POLITICA_CANCELACION =
    "Política de cancelación (ejemplo, editar según el negocio): puedes cancelar tu reserva antes de la fecha del evento. " +
    "Si ya pagaste, el pago se marca como reembolsado y el juego queda libre para otros clientes.";

  const CLAVE_SESION = "juegaya_sesion";

  interface Sesion { nombre: string; email: string; token?: string; usuarioId?: number; rol?: string; }

  const ETIQUETA_PEDIDO: Record<string, [string, string]> = {
    BORRADOR: ["Sin completar", "secondary"],
    PENDIENTE: ["Pendiente de pago", "warning"],
    CONFIRMADO: ["Confirmada", "success"],
    CANCELADO: ["Cancelada", "danger"]
  };
  const ETIQUETA_PAGO: Record<string, [string, string]> = {
    PENDIENTE: ["Pago pendiente", "warning"],
    APROBADO: ["Pago aprobado", "success"],
    RECHAZADO: ["Pago rechazado", "danger"],
    REEMBOLSADO: ["Pago reembolsado", "info"]
  };

  const $ = <T extends HTMLElement>(selector: string): T => document.querySelector(selector) as T;
  const clp = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
  // lo que viene de la API se escapa antes de meterlo como HTML (nombres, comentarios, etc.)
  const esc = (s: unknown): string => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" } as Record<string, string>)[c]);

  function aviso(mensaje: string): void {
    const toast = $("#appToast");
    $("#toastMensaje").textContent = mensaje;
    (window as any).bootstrap.Toast.getOrCreateInstance(toast).show();
  }

  function leerSesion(): Sesion | null {
    try { return JSON.parse(localStorage.getItem(CLAVE_SESION) || "null"); } catch (e) { return null; }
  }

  const sesion = leerSesion();
  if (!sesion || !sesion.token || !sesion.usuarioId) {
    window.location.href = "iniciar-sesion.html"; // sin sesión no hay "mis reservas"
    return;
  }
  const usuarioId: number = sesion.usuarioId;
  const lista = $("#listaReservas");
  let nombresJuegos: Record<string, string> = {};
  let reservas: { pedido: ApiPedido; pago: ApiEstadoPago | null }[] = [];

  $("#nombreCliente").textContent = sesion.nombre;
  $("#textoPolitica").textContent = POLITICA_CANCELACION;

  // ---------- HU-003: cerrar sesión ----------
  $("#cerrarSesion").addEventListener("click", async () => {
    try { await apiUsuarios.logout(sesion.token!); } catch (e) { /* si el token ya venció igual cierro acá */ }
    localStorage.removeItem(CLAVE_SESION);
    window.location.href = "iniciar-sesion.html";
  });

  // ---------- HU-024 / HU-027: cargar y pintar las reservas ----------
  async function cargar(): Promise<void> {
    lista.innerHTML = `<p class="text-secondary">Cargando tus reservas...</p>`;
    try {
      const [pedidos, juegos] = await Promise.all([apiPedidos.listarPorUsuario(usuarioId), apiCatalogo.listarTodos()]);
      nombresJuegos = {};
      juegos.forEach(j => { nombresJuegos[j.id] = j.nombre; });

      reservas = await Promise.all(pedidos.slice().sort((a, b) => b.id - a.id).map(async pedido => {
        let pago: ApiEstadoPago | null = null;
        if (pedido.estado !== "BORRADOR") {
          try { pago = await apiPagos.estadoDePedido(pedido.id); } catch (e) { pago = null; } // 404 = todavía no tiene pago
        }
        return { pedido, pago };
      }));
      pintar();
    } catch (e) {
      lista.innerHTML = `<div class="alert alert-danger">${esc((e as Error).message)}</div>`;
    }
  }

  function insignia(par: [string, string]): string {
    return `<span class="badge text-bg-${par[1]}">${esc(par[0])}</span>`;
  }

  function pintar(): void {
    if (!reservas.length) {
      lista.innerHTML = `<div class="card border-0 shadow-sm p-4 text-center"><p class="mb-2">Todavía no tienes reservas.</p><a class="btn btn-primary" href="catalogo.html#catalogo">Ver catálogo</a></div>`;
      return;
    }
    const hoy = new Date().toISOString().slice(0, 10);

    lista.innerHTML = reservas.map(({ pedido, pago }) => {
      const etPedido = ETIQUETA_PEDIDO[pedido.estado] || [pedido.estado, "secondary"];
      const etPago = pago ? (ETIQUETA_PAGO[pago.estado] || [pago.estado, "secondary"]) : null;
      const realizada = pedido.items.length > 0 && pedido.items.every(i => i.fechaEvento <= hoy);
      const puedeCancelar = pedido.estado === "PENDIENTE" || pedido.estado === "CONFIRMADO";
      const puedeCalificar = pedido.estado === "CONFIRMADO" && pago?.estado === "APROBADO" && realizada;

      const items = pedido.items.map(i => `
        <div class="d-flex justify-content-between align-items-center border-top py-2">
          <div><strong>${esc(nombresJuegos[i.juegoId] || i.juegoId)}</strong>
            <small class="d-block text-secondary">${esc(i.fechaEvento)} · ${i.horas} hora${i.horas === 1 ? "" : "s"}</small></div>
          <div class="text-end">${clp.format(i.subtotal)}
            ${puedeCalificar ? `<button class="btn btn-sm btn-outline-primary ms-2" data-accion="calificar" data-juego="${esc(i.juegoId)}">Calificar</button>` : ""}</div>
        </div>`).join("");

      return `
      <div class="card border-0 shadow-sm mb-3"><div class="card-body">
        <div class="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
          <div><h2 class="h6 fw-bold mb-1">Reserva ${esc(pedido.codigo || "#" + pedido.id)}</h2>${insignia(etPedido as [string, string])} ${etPago ? insignia(etPago as [string, string]) : ""}</div>
          <div class="text-end"><small class="text-secondary d-block">Total</small><strong>${clp.format(pedido.total)}</strong></div>
        </div>
        ${items || `<p class="text-secondary mb-0">Sin juegos.</p>`}
        <div class="d-flex flex-wrap gap-2 mt-3">
          ${pedido.estado === "BORRADOR" ? `<a class="btn btn-sm btn-primary" href="detalle-compra.html?pedido=${pedido.id}">Completar reserva</a>` : ""}
          ${puedeCancelar ? `<button class="btn btn-sm btn-outline-danger" data-accion="cancelar" data-id="${pedido.id}">Cancelar reserva</button>` : ""}
        </div>
      </div></div>`;
    }).join("");
  }

  // ---------- HU-029 + HU-030: cancelar (primero se muestra la política) ----------
  async function cancelar(pedidoId: number): Promise<void> {
    const reserva = reservas.find(r => r.pedido.id === pedidoId);
    if (!reserva) return;
    if (!confirm(`${POLITICA_CANCELACION}\n\n¿Cancelar esta reserva?`)) return;
    try {
      await apiPedidos.cancelar(pedidoId);
      try { await apiCatalogo.liberar(pedidoId); } catch (e) { /* si no había fechas bloqueadas, no pasa nada */ }
      if (reserva.pago && reserva.pago.estado === "APROBADO") {
        await apiPagos.reembolsar(reserva.pago.pagoId);
        aviso("Reserva cancelada y pago reembolsado");
      } else {
        aviso("Reserva cancelada");
      }
    } catch (e) {
      aviso((e as Error).message);
    }
    await cargar();
  }

  // ---------- HU-031 / HU-032: calificar y comentar ----------
  let juegoAResenar = "";
  const modalEl = $("#modalResena");
  const modal = () => (window as any).bootstrap.Modal.getOrCreateInstance(modalEl);

  $("#enviarResena").addEventListener("click", async () => {
    const estrellas = parseInt($<HTMLSelectElement>("#resenaEstrellas").value, 10);
    const comentario = $<HTMLTextAreaElement>("#resenaComentario").value.trim();
    try {
      await apiCatalogo.resenar(juegoAResenar, { usuarioId, autor: sesion.nombre, estrellas, comentario });
      modal().hide();
      $<HTMLTextAreaElement>("#resenaComentario").value = "";
      aviso("¡Gracias por tu reseña!");
    } catch (e) {
      aviso((e as Error).message);
    }
  });

  // un solo listener para todos los botones de las tarjetas (se crean al pintar)
  lista.addEventListener("click", ev => {
    const b = (ev.target as HTMLElement).closest<HTMLButtonElement>("[data-accion]");
    if (!b) return;
    if (b.dataset.accion === "cancelar") cancelar(Number(b.dataset.id));
    if (b.dataset.accion === "calificar") {
      juegoAResenar = b.dataset.juego as string;
      $("#resenaJuego").textContent = nombresJuegos[juegoAResenar] || juegoAResenar;
      modal().show();
    }
  });

  cargar();
})();
