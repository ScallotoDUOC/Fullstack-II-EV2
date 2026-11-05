import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { apiCatalogo } from "../api/api";
import type { ApiJuego, ApiJuegoDatos } from "../api/api";
import { useAviso } from "../context/Toast";
import { aApiCat, CATEGORIAS, CLAVE_DESCUENTOS, clp, deApiCat, hoyISO, leerDescuentos, precioHora } from "../utils";
import type { CategoriaUI, Descuento } from "../utils";

// Reservas manuales del admin: viven solo en este navegador (la API no tiene "listar todos los pedidos").
type Estado = "pendiente" | "confirmada" | "completada" | "cancelada";
interface ReservaLocal { id: string; codigo: string; cliente: string; telefono: string; juegoId: string; fecha: string; horas: number; total: number; estado: Estado; }
const CLAVE = "juegaya-react-reservas"; // clave propia: no pisa los datos del admin HTML original
const leer = (): ReservaLocal[] => { try { const v = JSON.parse(localStorage.getItem(CLAVE) || "[]"); return Array.isArray(v) ? v : []; } catch { return []; } };

const VACIO = { id: "", nombre: "", categoria: "Inflable" as CategoriaUI, precioJornada: 90000, descripcion: "", imagenUrl: "", capacidad: "", activo: true };
const slug = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default function Admin() {
  const aviso = useAviso();
  const [tab, setTab] = useState<"resumen" | "juegos" | "reservas" | "descuentos">("resumen");
  const [juegos, setJuegos] = useState<ApiJuego[]>([]);
  const [error, setError] = useState("");
  const [reservas, setReservas] = useState<ReservaLocal[]>(leer);
  const [form, setForm] = useState<typeof VACIO | null>(null);
  const [editando, setEditando] = useState(false);
  const [rf, setRf] = useState({ cliente: "", telefono: "", juegoId: "", fecha: hoyISO(), horas: 6 });

  const [descuentos, setDescuentos] = useState<Descuento[]>(leerDescuentos);
  const [df, setDf] = useState<Descuento>({ codigo: "", tipo: "porcentaje", valor: 10, activo: true });
  const guardarDescuentos = (l: Descuento[]) => { setDescuentos(l); localStorage.setItem(CLAVE_DESCUENTOS, JSON.stringify(l)); };
  const agregarDescuento = (e: FormEvent) => {
    e.preventDefault();
    const codigo = df.codigo.trim().toUpperCase();
    if (!codigo || df.valor <= 0 || (df.tipo === "porcentaje" && df.valor > 100)) { aviso("Revisa el código y el valor"); return; }
    if (descuentos.some(d => d.codigo === codigo)) { aviso("Ese código ya existe"); return; }
    guardarDescuentos([...descuentos, { ...df, codigo }]); setDf({ ...df, codigo: "" });
  };

  const cargar = useCallback(() => { apiCatalogo.listarTodos().then(setJuegos).catch(e => setError((e as Error).message)); }, []);
  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => { localStorage.setItem(CLAVE, JSON.stringify(reservas)); }, [reservas]);

  const guardarJuego = async (e: FormEvent) => {
    e.preventDefault();
    if (!form) return;
    const datos: ApiJuegoDatos = { nombre: form.nombre.trim(), categoria: aApiCat(form.categoria), precioJornada: Number(form.precioJornada), descripcion: form.descripcion, imagenUrl: form.imagenUrl || undefined, capacidad: form.capacidad || undefined, activo: form.activo };
    try {
      if (editando) await apiCatalogo.editar(form.id, datos);
      else await apiCatalogo.crear({ ...datos, ...({ id: form.id || slug(form.nombre) } as object) } as ApiJuegoDatos);
      aviso("Juego guardado"); setForm(null); cargar();
    } catch (err) { aviso((err as Error).message); }
  };
  const eliminar = async (j: ApiJuego) => {
    if (!confirm(`¿Eliminar "${j.nombre}"?`)) return;
    try { await apiCatalogo.eliminar(j.id); aviso("Juego eliminado"); cargar(); } catch (err) { aviso((err as Error).message); }
  };
  const agregarReserva = (e: FormEvent) => {
    e.preventDefault();
    const j = juegos.find(x => x.id === rf.juegoId);
    if (!j) { aviso("Elige un juego"); return; }
    setReservas([{ id: crypto.randomUUID(), codigo: "JY-" + Math.random().toString(36).slice(2, 7).toUpperCase(), ...rf, total: precioHora(j.precioJornada) * rf.horas, estado: "pendiente" }, ...reservas]);
    setRf({ ...rf, cliente: "", telefono: "" });
  };
  const nombreJuego = (id: string) => juegos.find(j => j.id === id)?.nombre || id;
  const ingresos = reservas.filter(r => r.estado !== "cancelada").reduce((s, r) => s + r.total, 0);

  return (
    <main className="container py-5">
      <h1 className="h3 fw-bold mb-3">Panel de administración</h1>
      <ul className="nav nav-pills mb-4">
        {(["resumen", "juegos", "reservas", "descuentos"] as const).map(t => <li className="nav-item" key={t}><button className={`nav-link ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)}</button></li>)}
      </ul>
      {error && <div className="alert alert-danger">{error}</div>}

      {tab === "resumen" && (
        <div className="row g-3">
          {[["Juegos", juegos.length], ["Activos", juegos.filter(j => j.activo).length], ["Reservas (locales)", reservas.length], ["Ingresos (locales)", clp(ingresos)]].map(([t, v]) => (
            <div className="col-6 col-lg-3" key={t as string}><div className="card border-0 shadow-sm p-3"><small className="text-secondary">{t}</small><div className="fs-4 fw-bold">{v}</div></div></div>))}
        </div>)}

      {tab === "juegos" && (
        <>
          <button className="btn btn-primary mb-3" onClick={() => { setForm({ ...VACIO }); setEditando(false); }}>+ Nuevo juego</button>
          <div className="table-responsive"><table className="table align-middle">
            <thead><tr><th>Nombre</th><th>Categoría</th><th>Jornada</th><th>Estado</th><th></th></tr></thead>
            <tbody>{juegos.map(j => (
              <tr key={j.id}><td>{j.nombre}</td><td>{deApiCat(j.categoria)}</td><td>{clp(j.precioJornada)}</td>
                <td><span className={`badge text-bg-${j.activo ? "success" : "secondary"}`}>{j.activo ? "Activo" : "Oculto"}</span></td>
                <td className="text-end">
                  <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => { setForm({ id: j.id, nombre: j.nombre, categoria: deApiCat(j.categoria), precioJornada: j.precioJornada, descripcion: j.descripcion || "", imagenUrl: j.imagenUrl || "", capacidad: j.capacidad || "", activo: j.activo }); setEditando(true); }}>Editar</button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => eliminar(j)}>Eliminar</button></td></tr>))}</tbody>
          </table></div>
          {form && (
            <div className="modal d-block" style={{ background: "rgba(0,0,0,.5)" }}><div className="modal-dialog"><form className="modal-content" onSubmit={guardarJuego}>
              <div className="modal-header"><h2 className="modal-title h5">{editando ? "Editar juego" : "Nuevo juego"}</h2><button type="button" className="btn-close" onClick={() => setForm(null)}></button></div>
              <div className="modal-body">
                <label className="form-label">Nombre</label><input required className="form-control mb-2" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
                {!editando && <><label className="form-label">ID (opcional, se genera del nombre)</label><input className="form-control mb-2" value={form.id} onChange={e => setForm({ ...form, id: e.target.value })} /></>}
                <label className="form-label">Categoría</label><select className="form-select mb-2" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value as CategoriaUI })}>{CATEGORIAS.map(c => <option key={c}>{c}</option>)}</select>
                <label className="form-label">Precio por jornada (6 h)</label><input type="number" min={1} required className="form-control mb-2" value={form.precioJornada} onChange={e => setForm({ ...form, precioJornada: Number(e.target.value) })} />
                <label className="form-label">Descripción</label><textarea className="form-control mb-2" rows={2} value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} />
                <label className="form-label">URL de imagen</label><input className="form-control mb-2" value={form.imagenUrl} onChange={e => setForm({ ...form, imagenUrl: e.target.value })} />
                <label className="form-label">Capacidad</label><input className="form-control mb-2" value={form.capacidad} onChange={e => setForm({ ...form, capacidad: e.target.value })} />
                <div className="form-check"><input id="act" type="checkbox" className="form-check-input" checked={form.activo} onChange={e => setForm({ ...form, activo: e.target.checked })} /><label htmlFor="act" className="form-check-label">Visible en el catálogo</label></div>
              </div>
              <div className="modal-footer"><button className="btn btn-primary">Guardar</button></div>
            </form></div></div>)}
        </>)}

      {tab === "descuentos" && (
        <>
          <div className="alert alert-warning small">Los códigos se guardan solo en este navegador y los aplica el carrito del cliente como estimación.</div>
          <form className="row g-2 mb-4" onSubmit={agregarDescuento}>
            <div className="col-md-4"><input required placeholder="Código (ej: NAVIDAD15)" className="form-control" value={df.codigo} onChange={e => setDf({ ...df, codigo: e.target.value })} /></div>
            <div className="col-md-3"><select className="form-select" value={df.tipo} onChange={e => setDf({ ...df, tipo: e.target.value as Descuento["tipo"] })}><option value="porcentaje">Porcentaje (%)</option><option value="fijo">Monto fijo ($)</option></select></div>
            <div className="col-md-3"><input type="number" min={1} className="form-control" value={df.valor} onChange={e => setDf({ ...df, valor: Number(e.target.value) })} /></div>
            <div className="col-md-2"><button className="btn btn-primary w-100">Agregar</button></div>
          </form>
          <div className="table-responsive"><table className="table align-middle">
            <thead><tr><th>Código</th><th>Descuento</th><th>Estado</th><th></th></tr></thead>
            <tbody>{descuentos.map(d => (
              <tr key={d.codigo}><td><strong>{d.codigo}</strong></td><td>{d.tipo === "porcentaje" ? `${d.valor}%` : clp(d.valor)}</td>
                <td><div className="form-check form-switch"><input className="form-check-input" type="checkbox" checked={d.activo} onChange={e => guardarDescuentos(descuentos.map(x => x.codigo === d.codigo ? { ...x, activo: e.target.checked } : x))} /></div></td>
                <td className="text-end"><button className="btn btn-sm btn-outline-danger" onClick={() => guardarDescuentos(descuentos.filter(x => x.codigo !== d.codigo))}>Borrar</button></td></tr>))}</tbody>
          </table></div>
        </>)}

      {tab === "reservas" && (
        <>
          <div className="alert alert-warning small">Estas reservas se guardan solo en este navegador (la API aún no tiene "listar todos los pedidos").</div>
          <form className="row g-2 mb-4" onSubmit={agregarReserva}>
            <div className="col-md-3"><input required placeholder="Cliente" className="form-control" value={rf.cliente} onChange={e => setRf({ ...rf, cliente: e.target.value })} /></div>
            <div className="col-md-2"><input placeholder="Teléfono" className="form-control" value={rf.telefono} onChange={e => setRf({ ...rf, telefono: e.target.value })} /></div>
            <div className="col-md-3"><select required className="form-select" value={rf.juegoId} onChange={e => setRf({ ...rf, juegoId: e.target.value })}><option value="">Juego...</option>{juegos.map(j => <option key={j.id} value={j.id}>{j.nombre}</option>)}</select></div>
            <div className="col-md-2"><input type="date" className="form-control" value={rf.fecha} onChange={e => setRf({ ...rf, fecha: e.target.value })} /></div>
            <div className="col-md-1"><select className="form-select" value={rf.horas} onChange={e => setRf({ ...rf, horas: Number(e.target.value) })}>{[1, 2, 3, 4, 5, 6].map(h => <option key={h}>{h}</option>)}</select></div>
            <div className="col-md-1"><button className="btn btn-primary w-100">+</button></div>
          </form>
          <div className="table-responsive"><table className="table align-middle">
            <thead><tr><th>Código</th><th>Cliente</th><th>Juego</th><th>Fecha</th><th>Total</th><th>Estado</th><th></th></tr></thead>
            <tbody>{reservas.map(r => (
              <tr key={r.id}><td>{r.codigo}</td><td>{r.cliente}<small className="d-block text-secondary">{r.telefono}</small></td><td>{nombreJuego(r.juegoId)}</td><td>{r.fecha} · {r.horas} h</td><td>{clp(r.total)}</td>
                <td><select className="form-select form-select-sm" value={r.estado} onChange={e => setReservas(reservas.map(x => x.id === r.id ? { ...x, estado: e.target.value as Estado } : x))}>
                  {(["pendiente", "confirmada", "completada", "cancelada"] as Estado[]).map(s => <option key={s}>{s}</option>)}</select></td>
                <td><button className="btn btn-sm btn-outline-danger" onClick={() => setReservas(reservas.filter(x => x.id !== r.id))}>Borrar</button></td></tr>))}</tbody>
          </table></div>
        </>)}
    </main>
  );
}
