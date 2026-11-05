import { useCallback, useEffect, useState } from "react";
import { apiCatalogo, apiPagos, apiPedidos } from "../api/api";
import type { ApiEstadoPago, ApiPedido } from "../api/api";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/Auth";
import { useAviso } from "../context/Toast";
import { clp, hoyISO } from "../utils";

const POLITICA = "Política de cancelación (ejemplo, editar según el negocio): puedes cancelar tu reserva antes de la fecha del evento. Si ya pagaste, el pago se marca como reembolsado y el juego queda libre para otros clientes.";
const ET_PEDIDO: Record<string, [string, string]> = { BORRADOR: ["Sin completar", "secondary"], PENDIENTE: ["Pendiente de pago", "warning"], CONFIRMADO: ["Confirmada", "success"], CANCELADO: ["Cancelada", "danger"] };
const ET_PAGO: Record<string, [string, string]> = { PENDIENTE: ["Pago pendiente", "warning"], APROBADO: ["Pago aprobado", "success"], RECHAZADO: ["Pago rechazado", "danger"], REEMBOLSADO: ["Pago reembolsado", "info"] };
type Fila = { pedido: ApiPedido; pago: ApiEstadoPago | null };

export default function MisReservas() {
  const { sesion, logout } = useAuth();
  const aviso = useAviso();
  const nav = useNavigate();
  const [filas, setFilas] = useState<Fila[] | null>(null);
  const [nombres, setNombres] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [hoy] = useState(hoyISO);
  const [resena, setResena] = useState<string | null>(null);
  const [estrellas, setEstrellas] = useState(5);
  const [comentario, setComentario] = useState("");

  const cargar = useCallback(async () => {
    if (!sesion) return;
    try {
      const [pedidos, juegos] = await Promise.all([apiPedidos.listarPorUsuario(sesion.usuarioId), apiCatalogo.listarTodos()]);
      setNombres(Object.fromEntries(juegos.map(j => [j.id, j.nombre])));
      setFilas(await Promise.all(pedidos.slice().sort((a, b) => b.id - a.id).map(async pedido => {
        let pago: ApiEstadoPago | null = null;
        if (pedido.estado !== "BORRADOR") { try { pago = await apiPagos.estadoDePedido(pedido.id); } catch { pago = null; } }
        return { pedido, pago };
      })));
    } catch (e) { setError((e as Error).message); }
  }, [sesion]);
  useEffect(() => { cargar(); }, [cargar]);

  const cancelar = async (f: Fila) => {
    if (!confirm(`${POLITICA}\n\n¿Cancelar esta reserva?`)) return;
    try {
      await apiPedidos.cancelar(f.pedido.id);
      try { await apiCatalogo.liberar(f.pedido.id); } catch { /* sin bloqueos */ }
      if (f.pago?.estado === "APROBADO") { await apiPagos.reembolsar(f.pago.pagoId); aviso("Reserva cancelada y pago reembolsado"); } else aviso("Reserva cancelada");
    } catch (e) { aviso((e as Error).message); }
    cargar();
  };

  const enviarResena = async () => {
    if (!sesion || !resena) return;
    try {
      await apiCatalogo.resenar(resena, { usuarioId: sesion.usuarioId, autor: sesion.nombre, estrellas, comentario: comentario.trim() });
      setResena(null); setComentario(""); aviso("¡Gracias por tu reseña!");
    } catch (e) { aviso((e as Error).message); }
  };

  const badge = (p: [string, string]) => <span className={`badge text-bg-${p[1]} me-1`}>{p[0]}</span>;
  return (
    <main className="container py-5">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <div><h1 className="h3 fw-bold mb-1">Mis reservas</h1><p className="text-secondary mb-0">Hola, <strong>{sesion?.nombre}</strong></p></div>
        <button className="btn btn-outline-dark rounded-pill px-3" onClick={async () => { await logout(); nav("/iniciar-sesion"); }}><i className="bi bi-box-arrow-right me-1"></i>Cerrar sesión</button>
      </div>
      <div className="alert alert-light border small"><i className="bi bi-info-circle me-1"></i>{POLITICA}</div>
      {error && <div className="alert alert-danger">{error}</div>}
      {!filas && !error && <p className="text-secondary">Cargando tus reservas...</p>}
      {filas && !filas.length && <div className="card border-0 shadow-sm p-4 text-center"><p className="mb-2">Todavía no tienes reservas.</p><Link className="btn btn-primary" to="/catalogo">Ver catálogo</Link></div>}
      {filas?.map(f => {
        const { pedido, pago } = f;
        const realizada = pedido.items.length > 0 && pedido.items.every(i => i.fechaEvento <= hoy);
        const puedeCalificar = pedido.estado === "CONFIRMADO" && pago?.estado === "APROBADO" && realizada;
        return (
          <div className="card border-0 shadow-sm mb-3" key={pedido.id}><div className="card-body">
            <div className="d-flex flex-wrap justify-content-between gap-2 mb-2">
              <div><h2 className="h6 fw-bold mb-1">Reserva {pedido.codigo || `#${pedido.id}`}</h2>
                {badge(ET_PEDIDO[pedido.estado] || [pedido.estado, "secondary"])}{pago && badge(ET_PAGO[pago.estado] || [pago.estado, "secondary"])}</div>
              <div className="text-end"><small className="text-secondary d-block">Total</small><strong>{clp(pedido.total)}</strong></div>
            </div>
            {pedido.items.map((i, k) => (
              <div key={k} className="d-flex justify-content-between align-items-center border-top py-2">
                <div><strong>{nombres[i.juegoId] || i.juegoId}</strong><small className="d-block text-secondary">{i.fechaEvento} · {i.horas} hora{i.horas === 1 ? "" : "s"}</small></div>
                <div>{clp(i.subtotal)}{puedeCalificar && <button className="btn btn-sm btn-outline-primary ms-2" onClick={() => setResena(i.juegoId)}>Calificar</button>}</div>
              </div>))}
            <div className="d-flex flex-wrap gap-2 mt-3">
              {pedido.estado === "BORRADOR" && <Link className="btn btn-sm btn-primary" to={`/detalle-compra?pedido=${pedido.id}`}>Completar reserva</Link>}
              {(pedido.estado === "PENDIENTE" || pedido.estado === "CONFIRMADO") && <button className="btn btn-sm btn-outline-danger" onClick={() => cancelar(f)}>Cancelar reserva</button>}
            </div>
          </div></div>);
      })}
      {resena && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,.5)" }} role="dialog">
          <div className="modal-dialog"><div className="modal-content">
            <div className="modal-header"><h2 className="modal-title h5">Calificar: {nombres[resena] || resena}</h2><button className="btn-close" aria-label="Cerrar" onClick={() => setResena(null)}></button></div>
            <div className="modal-body">
              <label className="form-label">Calificación</label>
              <select className="form-select mb-3" value={estrellas} onChange={e => setEstrellas(Number(e.target.value))}>
                <option value={5}>5 - Excelente</option><option value={4}>4 - Muy bueno</option><option value={3}>3 - Bueno</option><option value={2}>2 - Regular</option><option value={1}>1 - Malo</option></select>
              <label className="form-label">Comentario (opcional)</label>
              <textarea className="form-control" rows={3} maxLength={500} value={comentario} onChange={e => setComentario(e.target.value)} />
            </div>
            <div className="modal-footer"><button className="btn btn-primary" onClick={enviarResena}>Publicar reseña</button></div>
          </div></div>
        </div>)}
    </main>
  );
}
