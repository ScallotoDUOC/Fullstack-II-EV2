import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiCatalogo, apiUsuarios } from "../api/api";
import type { ApiJuego } from "../api/api";
import { useAuth } from "../context/Auth";
import { useCart } from "../context/Cart";
import { useAviso } from "../context/Toast";
import { clp, COMUNAS, deApiCat, hoyISO, precioHora } from "../utils";

const iconoMeta = (t: string) =>
  /ni[ñn]os|jugador|persona|adulto|pax/i.test(t) ? "bi-people" : /×|\dx\d|\d\s?x\s?\d|metros|\bm\b/i.test(t) ? "bi-rulers" : /\bV\b|volt|watt|\bW\b/i.test(t) ? "bi-lightning-charge" : "bi-info-circle";
const partesMeta = (cap: string | null) => (cap ? cap.split(/\s*[·|;/]\s*|,\s+/).map(s => s.trim()).filter(Boolean) : []);

export default function Catalogo() {
  const [juegos, setJuegos] = useState<ApiJuego[]>([]);
  const [libres, setLibres] = useState<Set<string> | null>(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  // Los favoritos se guardan en el servidor, ligados a la cuenta: cada perfil ve solo los suyos
  const { sesion } = useAuth();
  const token = sesion?.token;
  const [favoritos, setFavoritos] = useState<string[]>([]);
  useEffect(() => {
    try { localStorage.removeItem("juegaya_favoritos"); } catch { /* clave antigua compartida entre perfiles: ya no se usa */ }
    setFavoritos([]);
    if (!token) return;
    let vigente = true;
    apiUsuarios.favoritos(token).then(f => { if (vigente) setFavoritos(f); }).catch(() => { /* sin conexión: se muestran vacíos */ });
    return () => { vigente = false; };
  }, [token]);
  const toggleFav = (id: string) => {
    if (!token) { aviso("Inicia sesión para guardar tus favoritos"); return; }
    const era = favoritos.includes(id);
    setFavoritos(p => (era ? p.filter(x => x !== id) : [...p, id]));
    (era ? apiUsuarios.quitarFavorito(token, id) : apiUsuarios.agregarFavorito(token, id)).catch(e => {
      setFavoritos(p => (era ? [...p, id] : p.filter(x => x !== id)));
      aviso((e as Error).message);
    });
  };
  const [cat, setCat] = useState("");
  const [horas, setHoras] = useState<Record<string, number>>({});
  const carrito = useCart();
  const aviso = useAviso();

  useEffect(() => {
    apiCatalogo.listar().then(setJuegos).catch(e => setError((e as Error).message)).finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    if (!carrito.fecha) { setLibres(null); return; }
    apiCatalogo.disponibles(carrito.fecha).then(l => setLibres(new Set(l.map(j => j.id)))).catch(() => setLibres(null));
  }, [carrito.fecha]);

  const visibles = useMemo(() => juegos.filter(j =>
    (!cat || deApiCat(j.categoria) === cat)), [juegos, cat]);

  const agregar = (j: ApiJuego) => {
    carrito.agregar({ id: j.id, nombre: j.nombre, horas: horas[j.id] || 6, precioHora: precioHora(j.precioJornada) });
    aviso(`${j.nombre} agregado a tu reserva`);
  };


  return (
    <main id="inicio">
      <section className="hero-section">
        <div className="container py-5">
          <div className="row align-items-center g-5 py-lg-4">
            <div className="col-lg-7">
              <h1 className="display-3 fw-bold mt-3 mb-3">Encuentra, agenda<br />y celebra.</h1>
              <p className="lead text-secondary mb-4">Revisa juegos disponibles, elige la fecha y arma tu reserva en pocos pasos.</p>
              <a className="btn btn-primary btn-lg rounded-pill px-4" href="#catalogo">Ver juegos <i className="bi bi-arrow-down-right ms-2"></i></a>
            </div>
            <div className="col-lg-5">
              <div className="availability-card shadow-lg">
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <div><small className="text-secondary">Agenda rápida</small><h2 className="h4 mb-0">¿Cuándo es tu evento?</h2></div>
                  <span className="calendar-icon"><i className="bi bi-calendar2-heart"></i></span>
                </div>
                <label htmlFor="fechaEvento" className="form-label fw-semibold">Fecha</label>
                <input type="date" id="fechaEvento" className="form-control form-control-lg mb-3" min={hoyISO()} value={carrito.fecha} onChange={e => carrito.setFecha(e.target.value)} />
                <label htmlFor="comunaEvento" className="form-label fw-semibold">Comuna</label>
                <select id="comunaEvento" aria-label="Comuna" className="form-select form-select-lg mb-4" value={carrito.comuna} onChange={e => carrito.setComuna(e.target.value)}>
                  <option value="">Selecciona una comuna</option>{Object.keys(COMUNAS).map(c => <option key={c}>{c}</option>)}
                </select>
                <a className="btn btn-dark w-100 btn-lg" href="#catalogo">Buscar disponibilidad</a>
                <p className="small text-secondary text-center mb-0 mt-3"><i className="bi bi-shield-check me-1"></i> Consulta sin compromiso</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-5" id="catalogo">
        <div className="container py-lg-4">
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-3 mb-4">
            <div>
              <span className="section-kicker">CATÁLOGO</span>
              <h2 className="display-6 fw-bold mb-1">El favorito de cada fiesta</h2>
              <p className="text-secondary mb-0">Precios referenciales por una jornada de hasta 6 horas.</p>
            </div>
            <div className="filter-pills" role="group" aria-label="Filtrar juegos por categoría">
              {[["", "Todos"], ["Inflable", "Inflables"], ["Acuático", "Acuáticos"], ["Interior", "Interior"], ["Exterior", "Exterior"]].map(([v, t]) => (
                <button key={t} type="button" className={`btn filter-btn${cat === v ? " active" : ""}`} onClick={() => setCat(v)}>{t}</button>))}
            </div>
          </div>
          {cargando && <p className="text-secondary">Cargando catálogo...</p>}
          {error && <div className="alert alert-danger">{error}</div>}
          {!cargando && !error && !visibles.length && <div className="empty-state"><i className="bi bi-emoji-frown"></i><h3>No hay juegos que coincidan</h3><p>Prueba con otra búsqueda o categoría.</p></div>}
          <div className="row g-4" id="listaJuegos">
            {visibles.map(j => {
              const ocupado = libres !== null && !libres.has(j.id);
              const prom = j.resenas.length ? (j.resenas.reduce((s, r) => s + r.estrellas, 0) / j.resenas.length).toFixed(1).replace(".", ",") : null;
              return (
                <div className="col-md-6 col-lg-4 game-item" key={j.id}>
                  <article className="game-card h-100">
                    <div className={`game-image-wrap${j.imagenUrl ? "" : " arcade-visual"}`}>
                      <Link to={`/producto/${j.id}`} aria-label={`Ver detalle de ${j.nombre}`}>
                        {j.imagenUrl
                          ? <img src={j.imagenUrl} className="game-image" alt={j.nombre} loading="lazy" />
                          : <><i className={`bi ${j.categoria === "INTERIOR" ? "bi-joystick" : j.categoria === "EXTERIOR" ? "bi-tree" : "bi-controller"}`}></i><span>{deApiCat(j.categoria).toUpperCase()}</span></>}
                      </Link>
                      {ocupado
                        ? <span className="status-badge"><i className="bi bi-x-circle-fill" style={{ color: "#dc3545" }}></i> No disponible</span>
                        : <span className="status-badge"><i className="bi bi-check-circle-fill"></i> Disponible</span>}
                      <button type="button" className={`favorite-btn${favoritos.includes(j.id) ? " active" : ""}`} aria-pressed={favoritos.includes(j.id)} aria-label={`${favoritos.includes(j.id) ? "Quitar" : "Agregar"} ${j.nombre} ${favoritos.includes(j.id) ? "de" : "a"} favoritos`} onClick={() => toggleFav(j.id)}>
                        <i className={`bi ${favoritos.includes(j.id) ? "bi-heart-fill" : "bi-heart"}`}></i>
                      </button>
                    </div>
                    <div className="p-4">
                      <div className="d-flex justify-content-between align-items-start gap-2">
                        <div><span className="game-type">{deApiCat(j.categoria).toUpperCase()}</span>
                          <h3 className="h4 mt-1 mb-2"><Link to={`/producto/${j.id}`} className="text-reset text-decoration-none">{j.nombre}</Link></h3></div>
                        {prom && <span className="rating"><i className="bi bi-star-fill"></i> {prom}</span>}
                      </div>
                      <p className="text-secondary">{j.descripcion}</p>
                      {partesMeta(j.capacidad).length > 0 && <div className="game-meta">{partesMeta(j.capacidad).map(t => <span key={t}><i className={`bi ${iconoMeta(t)}`}></i> {t}</span>)}</div>}
                      <hr className="mt-auto" />
                      <div className="d-flex justify-content-between align-items-center gap-2">
                        <div><span className="price">{clp(j.precioJornada)}</span><small className="text-secondary d-block">por jornada</small></div>
                        <div className="d-flex align-items-center gap-2">
                          <select className="form-select form-select-sm" style={{ width: "4.6rem" }} aria-label={`Horas de ${j.nombre}`} value={horas[j.id] || 6} onChange={e => setHoras({ ...horas, [j.id]: Number(e.target.value) })}>
                            {[1, 2, 3, 4, 5, 6].map(h => <option key={h} value={h}>{h} h</option>)}
                          </select>
                          <button type="button" className="btn btn-outline-dark rounded-pill add-btn" disabled={ocupado} onClick={() => agregar(j)}>Agregar</button>
                        </div>
                      </div>
                    </div>
                  </article>
                </div>);
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
