import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { apiCatalogo } from "../../api/api";
import type { ApiJuego, ApiJuegoDatos } from "../../api/api";
import { FILTRO_JUEGOS_INICIAL, filtrarYOrdenarJuegos } from "../../admin/filtros";
import type { FiltroJuegos, OrdenJuegos } from "../../admin/filtros";
import { ocupa } from "../../admin/tipos";
import type { FilaReserva } from "../../admin/tipos";
import { useAviso } from "../../context/Toast";
import { aApiCat, CATEGORIAS, clp, deApiCat, hoyISO, precioHora } from "../../utils";
import type { CategoriaUI } from "../../utils";
import { errorTextoLibre } from "../../validaciones";
import Modal from "../Modal";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Label } from "../ui/label";
import { NativeSelect } from "../ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import BloqueosModal from "./BloqueosModal";

interface Props { juegos: ApiJuego[]; filas: FilaReserva[]; recargar: () => Promise<void>; }
const VACIO = { id: "", nombre: "", categoria: "Inflable" as CategoriaUI, precioJornada: 90000, descripcion: "", imagenUrl: "", capacidad: "", activo: true };
const aDatos = (j: ApiJuego, activo: boolean): ApiJuegoDatos => ({ nombre: j.nombre, categoria: j.categoria, precioJornada: j.precioJornada, descripcion: j.descripcion || undefined, imagenUrl: j.imagenUrl || undefined, capacidad: j.capacidad || undefined, activo });

// Crear, editar, ocultar/mostrar, eliminar y bloquear fechas de los juegos
export default function JuegosTab({ juegos, filas, recargar }: Props) {
  const aviso = useAviso();
  const [form, setForm] = useState<typeof VACIO | null>(null);
  const [editando, setEditando] = useState(false);
  const [bloqueando, setBloqueando] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [filtro, setFiltro] = useState<FiltroJuegos>(FILTRO_JUEGOS_INICIAL);
  const lista = useMemo(() => filtrarYOrdenarJuegos(juegos, filtro), [juegos, filtro]);
  const hayFiltro = filtro.categoria !== "" || filtro.estado !== "" || filtro.orden !== "nombre" || !filtro.asc;

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    if (!form) return;
    const nombreJ = form.nombre.trim();
    const problema = nombreJ.length < 2 ? "El nombre del juego debe tener al menos 2 caracteres" : errorTextoLibre(nombreJ, 60, "El nombre") || errorTextoLibre(form.descripcion, 300, "La descripción") || errorTextoLibre(form.capacidad, 100, "La capacidad")
      || (form.imagenUrl.trim() && !/^(https?:\/\/|\/)\S+$/i.test(form.imagenUrl.trim()) ? "La URL de la imagen debe empezar con http://, https:// o /" : form.imagenUrl.length > 300 ? "La URL de la imagen es demasiado larga" : null)
      || (!(Number(form.precioJornada) >= 600 && Number(form.precioJornada) <= 10_000_000) ? "El precio por jornada debe estar entre $600 y $10.000.000" : null);
    if (problema) { aviso(problema); return; }
    const datos: ApiJuegoDatos = { nombre: form.nombre.trim(), categoria: aApiCat(form.categoria), precioJornada: Number(form.precioJornada), descripcion: form.descripcion || undefined, imagenUrl: form.imagenUrl || undefined, capacidad: form.capacidad || undefined, activo: form.activo };
    setGuardando(true);
    try {
      if (editando) await apiCatalogo.editar(form.id, datos); else await apiCatalogo.crear(datos);
      aviso(editando ? "Juego actualizado" : "Juego creado"); setForm(null); await recargar();
    } catch (err) { aviso((err as Error).message); } finally { setGuardando(false); }
  };

  const alternar = async (j: ApiJuego) => {
    try { await apiCatalogo.editar(j.id, aDatos(j, !j.activo)); aviso(j.activo ? "Juego oculto" : "Juego visible"); await recargar(); }
    catch (err) { aviso((err as Error).message); }
  };

  const eliminar = async (j: ApiJuego) => {
    if (filas.some(f => ocupa(f.estado) && f.juegoIds.includes(j.id))) { aviso("Tiene reservas activas: cancélalas antes o solo ocúltalo"); return; }
    if (!confirm(`¿Eliminar “${j.nombre}”? No se puede deshacer.`)) return;
    try { await apiCatalogo.eliminar(j.id); aviso("Juego eliminado"); await recargar(); } catch (err) { aviso((err as Error).message); }
  };

  const juegoBloqueo = juegos.find(j => j.id === bloqueando) || null;
  return (
    <>
      <Card className="tw:mb-4"><CardContent className="tw:flex tw:flex-wrap tw:items-end tw:gap-3">
        <Button onClick={() => { setForm({ ...VACIO }); setEditando(false); }}><i className="bi bi-plus-lg"></i> Nuevo juego</Button>
        <div className="tw:w-40"><Label htmlFor="fOrden">Ordenar por</Label>
          <NativeSelect id="fOrden" value={filtro.orden} onChange={e => setFiltro({ ...filtro, orden: e.target.value as OrdenJuegos })}><option value="nombre">Nombre</option><option value="precio">Precio</option></NativeSelect></div>
        <div><Label>Sentido</Label>
          <Button variant="outline" id="fSentido" aria-label={filtro.asc ? "Orden ascendente" : "Orden descendente"} onClick={() => setFiltro({ ...filtro, asc: !filtro.asc })}>
            <i className={`bi ${filtro.asc ? "bi-sort-up" : "bi-sort-down"}`}></i>{filtro.asc ? "Ascendente" : "Descendente"}</Button></div>
        <div className="tw:w-40"><Label htmlFor="fCategoria">Categoría</Label>
          <NativeSelect id="fCategoria" value={filtro.categoria} onChange={e => setFiltro({ ...filtro, categoria: e.target.value })}><option value="">Todas</option>{CATEGORIAS.map(c => <option key={c}>{c}</option>)}</NativeSelect></div>
        <div className="tw:w-36"><Label htmlFor="fEstado">Estado</Label>
          <NativeSelect id="fEstado" value={filtro.estado} onChange={e => setFiltro({ ...filtro, estado: e.target.value as FiltroJuegos["estado"] })}><option value="">Todos</option><option value="visible">Visible</option><option value="oculto">Oculto</option></NativeSelect></div>
        {hayFiltro && <Button variant="ghost" onClick={() => setFiltro(FILTRO_JUEGOS_INICIAL)}>Limpiar</Button>}
        <span className="tw:ml-auto tw:pb-2 tw:text-sm tw:text-muted-foreground" id="contadorJuegos">Mostrando {lista.length} de {juegos.length}</span>
      </CardContent></Card>
      {!juegos.length ? <p className="text-secondary">Aún no tienes juegos. Crea el primero con “Nuevo juego”.</p>
        : !lista.length ? <p className="text-secondary">Ningún juego coincide con los filtros.</p> : (
        <Card><Table>
          <TableHeader><TableRow><TableHead>Juego</TableHead><TableHead>Categoría</TableHead><TableHead>Precio jornada</TableHead><TableHead>Estado</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>{lista.map(j => (
            <TableRow key={j.id}>
              <TableCell label="Juego"><strong>{j.nombre}</strong><small className="d-block text-secondary">{j.descripcion}</small></TableCell>
              <TableCell label="Categoría">{deApiCat(j.categoria)}</TableCell>
              <TableCell label="Precio jornada">{clp(j.precioJornada)}<small className="d-block text-secondary">{clp(precioHora(j.precioJornada))} por hora</small></TableCell>
              <TableCell label="Estado"><Badge variant={j.activo ? "success" : "neutral"}>{j.activo ? "Visible" : "Oculto"}</Badge></TableCell>
              <TableCell className="tw:whitespace-nowrap tw:text-right">
                <span className="tw:inline-flex tw:gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => { setForm({ id: j.id, nombre: j.nombre, categoria: deApiCat(j.categoria), precioJornada: j.precioJornada, descripcion: j.descripcion || "", imagenUrl: j.imagenUrl || "", capacidad: j.capacidad || "", activo: j.activo }); setEditando(true); }}>Editar</Button>
                  <Button size="sm" variant="outline" onClick={() => alternar(j)}>{j.activo ? "Ocultar" : "Mostrar"}</Button>
                  <Button size="sm" variant="outline" onClick={() => setBloqueando(j.id)}>Fechas{j.bloqueos.length > 0 && ` (${j.bloqueos.length})`}</Button>
                  <Button size="sm" variant="destructive" onClick={() => eliminar(j)}>Eliminar</Button>
                </span>
              </TableCell>
            </TableRow>))}</TableBody>
        </Table></Card>)}
      {form && (
        <Modal titulo={editando ? "Editar juego" : "Nuevo juego"} onCerrar={() => setForm(null)}>
          <form id="formJuego" onSubmit={guardar}>
            <label className="form-label" htmlFor="jNombre">Nombre</label><input id="jNombre" required maxLength={60} className="form-control mb-2" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
            <label className="form-label" htmlFor="jCategoria">Categoría</label>
            <select id="jCategoria" className="form-select mb-2" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value as CategoriaUI })}>{CATEGORIAS.map(c => <option key={c}>{c}</option>)}</select>
            <label className="form-label" htmlFor="jPrecio">Precio por jornada (6 h)</label><input id="jPrecio" type="number" min={600} max={10000000} required className="form-control mb-1" value={form.precioJornada} onChange={e => setForm({ ...form, precioJornada: Number(e.target.value) })} />
            <div className="form-text mb-2">Se cobra por hora redondeado a la centena ({clp(precioHora(Number(form.precioJornada) || 0))} por hora). Con un precio múltiplo de 600 la hora queda exacta.</div>
            <label className="form-label" htmlFor="jDesc">Descripción</label><textarea id="jDesc" maxLength={300} className="form-control mb-2" rows={2} value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} />
            <label className="form-label" htmlFor="jImg">URL de imagen</label><input id="jImg" maxLength={300} className="form-control mb-2" value={form.imagenUrl} onChange={e => setForm({ ...form, imagenUrl: e.target.value })} />
            <label className="form-label" htmlFor="jCap">Capacidad y medidas (separadas por ·)</label><input id="jCap" maxLength={100} className="form-control mb-2" placeholder="7 niños · 4,5 × 3 m" value={form.capacidad} onChange={e => setForm({ ...form, capacidad: e.target.value })} />
            <div className="form-check"><input id="jActivo" type="checkbox" className="form-check-input" checked={form.activo} onChange={e => setForm({ ...form, activo: e.target.checked })} /><label htmlFor="jActivo" className="form-check-label">Visible en el catálogo</label></div>
            <button className="btn btn-primary mt-3" disabled={guardando}>{guardando ? "Guardando..." : "Guardar"}</button>
          </form>
        </Modal>)}
      {juegoBloqueo && <BloqueosModal juego={juegoBloqueo} hoy={hoyISO()} onCerrar={() => setBloqueando(null)} recargar={recargar} />}
    </>
  );
}
