import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiCatalogo } from "../api/api";
import type { ApiJuego } from "../api/api";
import { useCart } from "../context/Cart";
import { useAviso } from "../context/Toast";
import { clp, deApiCat, precioHora } from "../utils";

export default function DetalleProducto() {
  const { id = "" } = useParams();
  const [j, setJ] = useState<ApiJuego | null>(null);
  const [noExiste, setNoExiste] = useState(false);
  const carrito = useCart();
  const aviso = useAviso();
  useEffect(() => { apiCatalogo.obtener(id).then(setJ).catch(() => setNoExiste(true)); }, [id]);

  const prom = j && j.resenas.length ? (j.resenas.reduce((s, r) => s + r.estrellas, 0) / j.resenas.length).toFixed(1).replace(".", ",") : "—";
  return (
    <main>
      <section className="py-5">
        <div className="container py-lg-4">
          <Link to="/catalogo" className="text-secondary text-decoration-none small"><i className="bi bi-arrow-left me-1"></i> Volver al catálogo</Link>
          {noExiste && (
            <div className="empty-state"><i className="bi bi-emoji-frown"></i><h3>No encontramos ese juego</h3>
              <p>Puede que ya no esté disponible. <Link to="/catalogo">Vuelve al catálogo</Link> para ver las opciones actuales.</p></div>)}
          {!j && !noExiste && <p className="text-secondary mt-3">Cargando...</p>}
          {j && (
            <>
              <div className="row g-5 mt-1">
                <div className="col-lg-6">
                  <div className="game-image-wrap rounded-4" style={{ height: "24rem" }}>
                    {j.imagenUrl ? <img src={j.imagenUrl} className="game-image" alt={j.nombre} /> : <div className="game-image bg-light d-flex align-items-center justify-content-center text-secondary"><i className="bi bi-controller display-1"></i></div>}
                  </div>
                  <p className="small text-secondary mt-2 mb-0"><i className="bi bi-camera me-1"></i> Foto referencial del juego.</p>
                </div>
                <div className="col-lg-6">
                  <span className="game-type">{deApiCat(j.categoria).toUpperCase()}</span>
                  <h1 className="display-6 fw-bold mt-1 mb-2">{j.nombre}</h1>
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <span className="rating"><i className="bi bi-star-fill"></i> {prom}</span>
                    <span className="text-secondary small">{j.resenas.length ? `(${j.resenas.length} reseña${j.resenas.length === 1 ? "" : "s"})` : "(sin reseñas)"}</span>
                    <span className="status-badge position-static"><i className="bi bi-check-circle-fill"></i> {j.activo ? "Disponible" : "No disponible"}</span>
                  </div>
                  <p className="text-secondary">{j.descripcion}</p>
                  {j.capacidad && <div className="game-meta mb-4"><span><i className="bi bi-people"></i> {j.capacidad}</span></div>}
                  <div className="availability-card p-4 mb-4">
                    <div className="d-flex justify-content-between align-items-end mb-2">
                      <div><small className="text-secondary d-block">Precio por jornada (6 horas)</small><span className="price">{clp(j.precioJornada)}</span></div>
                      <div className="text-end"><small className="text-secondary d-block">Precio por hora</small><strong>{clp(precioHora(j.precioJornada))}</strong></div>
                    </div>
                    <button type="button" className="btn btn-primary btn-lg w-100 mt-2" onClick={() => { carrito.agregar({ id: j.id, nombre: j.nombre, horas: 6, precioHora: precioHora(j.precioJornada) }); carrito.setAbierto(true); aviso(`${j.nombre} agregado a la reserva`); }}>Agregar a mi reserva</button>
                    <p className="small text-secondary text-center mb-0 mt-2"><i className="bi bi-info-circle me-1"></i> Las horas y la fecha se ajustan en el carrito y el catálogo.</p>
                  </div>
                </div>
              </div>
              {j.resenas.length > 0 && (
                <div className="mt-4">
                  <h2 className="h4 fw-bold mb-3">Reseñas de clientes</h2>
                  {j.resenas.map((r, k) => (
                    <div key={k} className="border rounded-4 p-3 mb-2 bg-white"><strong>{r.autor}</strong> <span className="text-warning">{"★".repeat(r.estrellas)}</span><div className="small text-secondary">{r.comentario}</div></div>))}
                </div>)}
            </>)}
        </div>
      </section>
    </main>
  );
}
