import { useState } from "react";
import type { FormEvent } from "react";
import type { ApiJuego } from "../../api/api";
import { cambiarEstadoManual, cancelarPedido, crearReservaManual, eliminarManual } from "../../admin/acciones";
import { CAMPOS_BUSQUEDA, coincideBusqueda } from "../../admin/filtros";
import type { CampoBusqueda } from "../../admin/filtros";
import { ESTADOS, fechaLarga } from "../../admin/tipos";
import type { EstadoReserva, FilaReserva, ReservaManual } from "../../admin/tipos";
import { useAviso } from "../../context/Toast";
import { clp, hoyISO, normalizarRut, precioHora } from "../../utils";
import { errorNombre, errorTelefono, LIMITES, soloDigitos } from "../../validaciones";
import Modal from "../Modal";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { NativeSelect } from "../ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import EstadoBadge from "./EstadoBadge";

interface Props { filas: FilaReserva[]; juegos: ApiJuego[]; manuales: ReservaManual[]; setManuales: (l: ReservaManual[]) => void; recargar: () => Promise<void>; }

// Listado de reservas (manuales y de clientes), filtro por estado, creación manual, cambio de estado y eliminación
export default function ReservasTab({ filas, juegos, manuales, setManuales, recargar }: Props) {
  const aviso = useAviso();
  const [filtro, setFiltro] = useState("");
  const [campo, setCampo] = useState<CampoBusqueda>("todo");
  const [texto, setTexto] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [f, setF] = useState({ cliente: "", rut: "", telefono: "", juegoId: "", fecha: hoyISO(), horas: 6 });
  const [ocupado, setOcupado] = useState(false);
  const nombre = (id: string) => juegos.find(j => j.id === id)?.nombre || "Juego eliminado";
  const lista = filas.filter(x => (!filtro || x.estado === filtro) && coincideBusqueda(x, campo, texto, nombre));
  const activos = juegos.filter(j => j.activo);
  const juegoForm = juegos.find(j => j.id === f.juegoId);

  const crear = async (e: FormEvent) => {
    e.preventDefault();
    const problema = errorNombre(f.cliente) || errorTelefono(f.telefono);
    if (problema) { aviso(problema); return; }
    let rut: string | undefined;
    if (f.rut.trim()) {
      const n = normalizarRut(f.rut);
      if (!n) { aviso("El RUT no es válido. Ejemplo: 12.345.678-5"); return; }
      rut = n;
    }
    setOcupado(true);
    try {
      const r = await crearReservaManual({ ...f, cliente: f.cliente.trim(), rut }, filas);
      setManuales([r, ...manuales]); setAbierto(false); aviso("Reserva creada"); await recargar();
    } catch (err) { aviso((err as Error).message); } finally { setOcupado(false); }
  };

  const cambiar = async (fila: FilaReserva, estado: EstadoReserva) => {
    if (!fila.manual) return;
    try {
      const nueva = await cambiarEstadoManual(fila.manual, estado, juegos, filas);
      setManuales(manuales.map(m => (m.id === nueva.id ? nueva : m))); aviso("Estado actualizado"); await recargar();
    } catch (err) { aviso((err as Error).message); }
  };

  const eliminar = async (fila: FilaReserva) => {
    if (!fila.manual || !confirm(`¿Eliminar la reserva ${fila.codigo}?`)) return;
    try { await eliminarManual(fila.manual); setManuales(manuales.filter(m => m.id !== fila.manual!.id)); aviso("Reserva eliminada"); await recargar(); }
    catch (err) { aviso((err as Error).message); }
  };

  const cancelar = async (fila: FilaReserva) => {
    if (!fila.pedido || !confirm(`¿Cancelar la reserva ${fila.codigo}? Si ya estaba pagada, se reembolsa el pago.`)) return;
    try { await cancelarPedido(fila.pedido); aviso("Reserva cancelada"); await recargar(); } catch (err) { aviso((err as Error).message); }
  };

  return (
    <>
      <Card className="tw:mb-4"><CardContent className="tw:flex tw:flex-wrap tw:items-end tw:gap-3">
        <Button onClick={() => { setF({ cliente: "", rut: "", telefono: "", juegoId: activos[0]?.id || "", fecha: hoyISO(), horas: 6 }); setAbierto(true); }} disabled={!activos.length}><i className="bi bi-plus-lg"></i> Nueva reserva</Button>
        <div className="tw:w-44"><Label htmlFor="bCampo">Buscar por</Label>
          <NativeSelect id="bCampo" value={campo} onChange={e => setCampo(e.target.value as CampoBusqueda)}>{CAMPOS_BUSQUEDA.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</NativeSelect></div>
        <div className="tw:min-w-52 tw:flex-1"><Label htmlFor="bTexto">Buscar</Label>
          <Input id="bTexto" type="search" placeholder={campo === "precio" ? "Ej. 90000 o >50000" : campo === "fecha" ? "Ej. 2027-03 o 10/03/2027" : campo === "rut" ? "Ej. 12345678-5" : "Escribe para buscar..."} value={texto} onChange={e => setTexto(e.target.value)} /></div>
        <div className="tw:w-44"><Label htmlFor="bEstado">Estado</Label>
          <NativeSelect id="bEstado" aria-label="Filtrar por estado" value={filtro} onChange={e => setFiltro(e.target.value)}>
            <option value="">Todos los estados</option>{Object.entries(ESTADOS).map(([v, t]) => <option key={v} value={v}>{t}</option>)}</NativeSelect></div>
        {(texto || filtro || campo !== "todo") && <Button variant="ghost" onClick={() => { setTexto(""); setFiltro(""); setCampo("todo"); }}>Limpiar</Button>}
        <span className="tw:w-full tw:text-sm tw:text-muted-foreground" id="contadorReservas">Mostrando {lista.length} de {filas.length} reservas</span>
      </CardContent></Card>
      {!lista.length ? <p className="text-secondary">{filas.length ? "Ninguna reserva coincide con la búsqueda." : "Aún no hay reservas."}</p> : (
        <Card><Table>
          <TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Cliente</TableHead><TableHead>Juegos</TableHead><TableHead>Fecha</TableHead><TableHead>Total</TableHead><TableHead>Estado</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>{lista.map(x => (
            <TableRow key={x.key}>
              <TableCell label="Código"><strong>{x.codigo}</strong><small className="d-block text-secondary">{x.origen === "manual" ? "Manual" : "Cliente"}</small></TableCell>
              <TableCell label="Cliente">{x.cliente}{x.rut && <small className="d-block text-secondary">RUT {x.rut}</small>}<small className="d-block text-secondary">{x.telefono}</small></TableCell>
              <TableCell label="Juegos">{x.juegoIds.map(nombre).join(", ")}{x.manual && <small className="d-block text-secondary">{x.manual.horas} h</small>}</TableCell>
              <TableCell label="Fecha">{fechaLarga(x.fecha)}</TableCell><TableCell label="Total">{clp(x.total)}</TableCell>
              <TableCell label="Estado">{x.manual
                ? <NativeSelect className="tw:h-8 tw:w-36 tw:text-xs" aria-label={`Estado de ${x.codigo}`} value={x.estado} onChange={e => cambiar(x, e.target.value as EstadoReserva)}>{Object.entries(ESTADOS).map(([v, t]) => <option key={v} value={v}>{t}</option>)}</NativeSelect>
                : <EstadoBadge estado={x.estado} />}</TableCell>
              <TableCell className="tw:whitespace-nowrap tw:text-right">
                {x.manual && <Button size="sm" variant="destructive" onClick={() => eliminar(x)}>Eliminar</Button>}
                {x.pedido && (x.estado === "pendiente" || x.estado === "confirmada") && <Button size="sm" variant="destructive" onClick={() => cancelar(x)}>Cancelar</Button>}
              </TableCell>
            </TableRow>))}</TableBody>
        </Table></Card>)}
      <p className="small text-secondary">Las reservas de clientes se cancelan, no se eliminan (queda el historial). Las manuales se pueden eliminar.</p>
      {abierto && (
        <Modal titulo="Nueva reserva manual" onCerrar={() => setAbierto(false)}>
          <form id="formReserva" onSubmit={crear}>
            <label className="form-label" htmlFor="rCliente">Cliente</label><input id="rCliente" required maxLength={LIMITES.nombre} className="form-control mb-2" value={f.cliente} onChange={e => setF({ ...f, cliente: e.target.value })} />
            <label className="form-label" htmlFor="rRut">RUT del cliente (opcional)</label><input id="rRut" maxLength={LIMITES.rut} className="form-control mb-2" placeholder="12.345.678-5" autoComplete="off" value={f.rut} onChange={e => setF({ ...f, rut: e.target.value })} />
            <label className="form-label" htmlFor="rTel">Teléfono</label><input id="rTel" type="tel" inputMode="numeric" maxLength={LIMITES.telefono} placeholder="912345678" className="form-control mb-2" value={f.telefono} onChange={e => setF({ ...f, telefono: soloDigitos(e.target.value, LIMITES.telefono) })} />
            <label className="form-label" htmlFor="rJuego">Juego</label>
            <select id="rJuego" required className="form-select mb-2" value={f.juegoId} onChange={e => setF({ ...f, juegoId: e.target.value })}>{activos.map(j => <option key={j.id} value={j.id}>{j.nombre}</option>)}</select>
            <div className="row g-2">
              <div className="col-8"><label className="form-label" htmlFor="rFecha">Fecha</label><input id="rFecha" type="date" required min={hoyISO()} className="form-control" value={f.fecha} onChange={e => setF({ ...f, fecha: e.target.value })} /></div>
              <div className="col-4"><label className="form-label" htmlFor="rHoras">Horas</label><select id="rHoras" className="form-select" value={f.horas} onChange={e => setF({ ...f, horas: Number(e.target.value) })}>{[1, 2, 3, 4, 5, 6].map(h => <option key={h}>{h}</option>)}</select></div>
            </div>
            {juegoForm && <p className="small text-secondary mt-2 mb-0">Total: <strong>{clp(precioHora(juegoForm.precioJornada) * f.horas)}</strong> ({clp(precioHora(juegoForm.precioJornada))} por hora)</p>}
            <button className="btn btn-primary mt-3" disabled={ocupado}>{ocupado ? "Creando..." : "Crear reserva"}</button>
          </form>
        </Modal>)}
    </>
  );
}
