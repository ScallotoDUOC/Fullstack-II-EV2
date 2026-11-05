import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { apiCatalogo, apiPagos, apiPedidos } from "../api/api";
import type { ApiPedido } from "../api/api";
import { useAuth } from "../context/Auth";
import { useAviso } from "../context/Toast";
import { clp } from "../utils";

export default function DetalleCompra() {
  const [params] = useSearchParams();
  const pedidoId = Number(params.get("pedido"));
  const comuna = params.get("comuna") || "";
  const { sesion } = useAuth();
  const aviso = useAviso();
  const nav = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);
  const [pedido, setPedido] = useState<ApiPedido | null>(null);
  const [nombres, setNombres] = useState<Record<string, string>>({});
  const [errorCarga, setErrorCarga] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviada, setEnviada] = useState(false);
  const [f, setF] = useState({ nombre: sesion?.nombre || "", telefono: "", direccion: "", indicaciones: "" });
  const [metodo, setMetodo] = useState<"TRANSFERENCIA" | "TARJETA">("TRANSFERENCIA");

  useEffect(() => {
    if (!pedidoId) return;
    Promise.all([apiPedidos.obtener(pedidoId), apiCatalogo.listar()])
      .then(([p, js]) => { setPedido(p); setNombres(Object.fromEntries(js.map(j => [j.id, j.nombre]))); })
      .catch(e => setErrorCarga((e as Error).message));
  }, [pedidoId]);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const confirmar = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!pedido || !sesion || !formRef.current?.reportValidity()) return;
    setEnviando(true);
    try {
      const direccion = comuna ? `${f.direccion.trim()}, ${comuna}` : f.direccion.trim();
      const confirmado = await apiPedidos.confirmar(pedido.id, { nombre: f.nombre.trim(), telefono: f.telefono.trim(), direccion, indicaciones: f.indicaciones.trim() });
      const pago = await apiPagos.iniciar(pedido.id, sesion.usuarioId, confirmado.total, metodo);
      for (const i of confirmado.items) await apiCatalogo.bloquear(i.juegoId, i.fechaEvento, pedido.id);
      setEnviada(true);
      aviso(`Reserva ${confirmado.codigo} enviada. Pago #${pago.id} (${metodo.toLowerCase()}) pendiente de confirmación`);
      setTimeout(() => nav("/mis-reservas"), 1800);
    } catch (err) { aviso((err as Error).message); setEnviando(false); }
  };

  const yaEnviado = enviada || (pedido !== null && pedido.estado !== "BORRADOR");
  return (
    <main>
      <section className="py-5">
        <div className="container py-lg-4">
          <span className="section-kicker">DETALLE DE COMPRA</span>
          <h1 className="display-6 fw-bold mb-1">Revisa tu reserva</h1>
          <p className="text-secondary mb-4">Confirma los juegos, la entrega y el pago antes de enviar tu solicitud.</p>
          <div className="row g-4">
            <div className="col-lg-7">
              <div className="card shadow-sm border-0 p-4 mb-4">
                <h2 className="h5 fw-bold mb-3">Juegos seleccionados</h2>
                {!pedidoId && <p className="text-secondary mb-0">No hay una reserva en curso. Arma tu reserva desde el <Link to="/catalogo">catálogo</Link>.</p>}
                {pedidoId > 0 && !pedido && !errorCarga && <p className="text-secondary mb-0">Cargando tu reserva...</p>}
                {errorCarga && <p className="text-danger mb-0">{errorCarga}</p>}
                {pedido && !pedido.items.length && <p className="text-secondary mb-0">El pedido no tiene juegos.</p>}
                {pedido?.items.map((i, k) => (
                  <div className="cart-item" key={k}>
                    <div><strong>{nombres[i.juegoId] || i.juegoId}</strong><small className="d-block text-secondary">{i.horas} hora{i.horas === 1 ? "" : "s"} · {i.fechaEvento}</small></div>
                    <div className="text-end"><strong>{clp(i.subtotal)}</strong></div>
                  </div>))}
              </div>
              <div className="card shadow-sm border-0 p-4">
                <h2 className="h5 fw-bold mb-3">Datos de entrega</h2>
                <form ref={formRef} onSubmit={confirmar}>
                  <div className="row g-3">
                    <div className="col-md-6"><label htmlFor="nombreEntrega" className="form-label">Nombre completo</label><input type="text" className="form-control" id="nombreEntrega" required value={f.nombre} onChange={set("nombre")} /></div>
                    <div className="col-md-6"><label htmlFor="telefonoEntrega" className="form-label">Teléfono de contacto</label><input type="tel" className="form-control" id="telefonoEntrega" required value={f.telefono} onChange={set("telefono")} /></div>
                    <div className="col-12"><label htmlFor="direccionEntrega" className="form-label">Dirección</label><input type="text" className="form-control" id="direccionEntrega" placeholder="Calle, número, depto/casa" required value={f.direccion} onChange={set("direccion")} /></div>
                    <div className="col-md-6"><label htmlFor="fechaEntrega" className="form-label">Fecha del evento</label><input type="date" className="form-control" id="fechaEntrega" readOnly value={pedido?.items[0]?.fechaEvento || ""} /></div>
                    <div className="col-12"><label htmlFor="indicacionesEntrega" className="form-label">Indicaciones adicionales (opcional)</label><textarea className="form-control" id="indicacionesEntrega" rows={2} placeholder="Ej: acceso por estacionamiento, portón lateral, etc." value={f.indicaciones} onChange={set("indicaciones")} /></div>
                  </div>
                </form>
              </div>
            </div>
            <div className="col-lg-5">
              <div className="card shadow-sm border-0 p-4">
                <h2 className="h5 fw-bold mb-3">Resumen de costos</h2>
                <div className="d-flex justify-content-between mb-1"><span>Subtotal</span><strong>{pedido ? clp(pedido.subtotal) : "-"}</strong></div>
                <div className="d-flex justify-content-between mb-1"><span>Transporte {comuna && <span>({comuna})</span>}</span><strong>A coordinar</strong></div>
                <div className="d-flex justify-content-between fw-bold border-top pt-2 mt-1"><span>Total</span><strong>{pedido ? clp(pedido.total) : "-"}</strong></div>
                <hr />
                <h2 className="h6 fw-bold mb-2">Método de pago</h2>
                <div className="form-check mb-2"><input className="form-check-input" type="radio" name="metodoPago" id="pagoTransferencia" checked={metodo === "TRANSFERENCIA"} onChange={() => setMetodo("TRANSFERENCIA")} /><label className="form-check-label" htmlFor="pagoTransferencia">Transferencia bancaria</label></div>
                <div className="form-check mb-3"><input className="form-check-input" type="radio" name="metodoPago" id="pagoTarjeta" checked={metodo === "TARJETA"} onChange={() => setMetodo("TARJETA")} /><label className="form-check-label" htmlFor="pagoTarjeta">Tarjeta de crédito o débito</label></div>
                <button type="button" className="btn btn-primary btn-lg w-100" disabled={!pedido || enviando || yaEnviado} onClick={() => confirmar()}>
                  {enviando ? <><span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Enviando...</>
                    : enviada ? <><i className="bi bi-check2 me-2"></i>Solicitud enviada</>
                    : pedido && pedido.estado !== "BORRADOR" ? `Reserva ${pedido.codigo || ""} enviada (${pedido.estado})` : "Confirmar reserva"}
                </button>
                <p className="small text-secondary text-center mt-3 mb-0"><i className="bi bi-shield-check me-1"></i> Tu pago queda pendiente hasta que el administrador lo confirme.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
