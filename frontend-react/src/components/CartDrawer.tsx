import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiCatalogo, apiPedidos } from "../api/api";
import { useAuth } from "../context/Auth";
import { useCart } from "../context/Cart";
import { useAviso } from "../context/Toast";
import { calcularDescuento, clp, COMUNAS, descuentosActivos } from "../utils";

export default function CartDrawer() {
  const c = useCart();
  const { sesion } = useAuth();
  const aviso = useAviso();
  const nav = useNavigate();
  const [codigo, setCodigo] = useState("");
  const [enviando, setEnviando] = useState(false);

  const transporte = c.comuna ? COMUNAS[c.comuna] || 0 : 0;
  const desc = calcularDescuento(c.descuento, c.total);
  const total = Math.max(c.total + transporte - desc, 0);

  const aplicar = () => {
    const d = descuentosActivos().find(x => x.codigo.toUpperCase() === codigo.trim().toUpperCase());
    if (d) { c.setDescuento(d); aviso(`Código aplicado: ${d.tipo === "porcentaje" ? d.valor + "%" : clp(d.valor)} de descuento`); }
    else aviso("Código de descuento inválido");
  };

  const solicitar = async () => {
    if (!sesion) { aviso("Inicia sesión para solicitar tu reserva"); c.setAbierto(false); nav("/iniciar-sesion"); return; }
    if (!c.fecha || !c.comuna) { aviso('Primero elige la fecha y la comuna en "Buscar disponibilidad"'); c.setAbierto(false); nav("/catalogo"); return; }
    setEnviando(true);
    try {
      // el sistema no deja reservar un juego en una fecha ocupada
      const libres = new Set((await apiCatalogo.disponibles(c.fecha)).map(j => j.id));
      const ocupados = c.items.filter(i => !libres.has(i.id));
      if (ocupados.length) { aviso(`${ocupados.map(i => i.nombre).join(", ")}: no está disponible el ${c.fecha}. Quítalo o cambia la fecha.`); return; }
      const pedido = await apiPedidos.crear(sesion.usuarioId);
      for (const i of c.items) await apiPedidos.agregarItem(pedido.id, { juegoId: i.id, fechaEvento: c.fecha, horas: i.horas, precioHora: i.precioHora });
      const comuna = c.comuna;
      c.vaciar(); c.setAbierto(false);
      nav(`/detalle-compra?pedido=${pedido.id}&comuna=${encodeURIComponent(comuna)}`);
    } catch (e) { aviso((e as Error).message); } finally { setEnviando(false); }
  };

  if (!c.abierto) return null;
  return (
    <>
      <div className="offcanvas-backdrop fade show" onClick={() => c.setAbierto(false)}></div>
      <div className="offcanvas offcanvas-end show" tabIndex={-1} aria-labelledby="carritoTitulo" style={{ visibility: "visible" }} role="dialog">
        <div className="offcanvas-header border-bottom">
          <div><small className="text-secondary">RESUMEN</small><h2 className="offcanvas-title h4" id="carritoTitulo">Mi reserva</h2></div>
          <button type="button" className="btn-close" aria-label="Cerrar" onClick={() => c.setAbierto(false)}></button>
        </div>
        <div className="offcanvas-body d-flex flex-column">
          <div className="cart-context"><i className="bi bi-calendar2"></i><span>{c.fecha ? `${c.fecha}${c.comuna ? ` · ${c.comuna}` : ""}` : "Elige una fecha para ver disponibilidad"}</span></div>
          <div className="flex-grow-1 py-3">
            {!c.items.length ? (
              <div className="cart-empty text-center py-5"><i className="bi bi-bag"></i><h3 className="h5 mt-3">Tu reserva está vacía</h3><p className="text-secondary">Agrega un juego desde el catálogo.</p></div>
            ) : c.items.map(i => (
              <div className="cart-item" key={i.id}>
                <div>
                  <strong>{i.nombre}</strong>
                  <div className="d-flex align-items-center gap-2 mt-1">
                    <input type="number" className="form-control form-control-sm cart-hours-input" style={{ width: "4.5rem" }} min={1} max={6} value={i.horas} aria-label={`Horas de ${i.nombre}`}
                      onChange={e => c.cambiarHoras(i.id, Math.min(6, Math.max(1, Number(e.target.value) || 1)))} />
                    <small className="text-secondary">hora{i.horas === 1 ? "" : "s"}</small>
                  </div>
                </div>
                <div className="text-end"><strong>{clp(i.horas * i.precioHora)}</strong>
                  <button type="button" className="remove-item d-block ms-auto" aria-label={`Quitar ${i.nombre}`} onClick={() => c.quitar(i.id)}><i className="bi bi-trash"></i></button></div>
              </div>))}
          </div>
          <div className="cart-total border-top pt-3">
            <div className="d-flex justify-content-between mb-1"><span>Subtotal</span><strong>{clp(c.total)}</strong></div>
            <div className="d-flex justify-content-between mb-1"><span>Transporte <small className="text-secondary">{c.comuna ? `(${c.comuna})` : "(elige tu comuna)"}</small></span><strong>{clp(transporte)}</strong></div>
            {desc > 0 && <div className="d-flex justify-content-between mb-1"><span>Descuento</span><strong className="text-success">-{clp(desc)}</strong></div>}
            <div className="d-flex justify-content-between fw-bold border-top pt-2 mt-1"><span>Total</span><strong>{clp(total)}</strong></div>
            <div className="d-flex gap-2 mt-3"><input className="form-control form-control-sm" placeholder="Código de descuento" value={codigo} onChange={e => setCodigo(e.target.value)} /><button type="button" className="btn btn-outline-dark btn-sm" onClick={aplicar}>Aplicar</button></div>
            <p className="small text-secondary mb-0 mt-2"><i className="bi bi-tag"></i> Código disponible: <strong>{descuentosActivos()[0]?.codigo}</strong></p>
            <button className="btn btn-primary btn-lg w-100 mt-3" disabled={!c.items.length || enviando} onClick={solicitar}>{enviando ? "Enviando..." : "Solicitar reserva"}</button>
            <Link to="/mis-reservas" onClick={() => c.setAbierto(false)} className="btn btn-outline-dark w-100 mt-2">Ver mis reservas</Link>
          </div>
        </div>
      </div>
    </>
  );
}
