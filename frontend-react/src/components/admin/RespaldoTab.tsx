import { useMemo, useRef, useState } from "react";
import { apiCatalogo } from "../../api/api";
import type { ApiJuego } from "../../api/api";
import { armarCopia, validarCopia } from "../../admin/datosLocales";
import { enRango, periodoInicial, rangoDe } from "../../admin/periodo";
import type { Periodo } from "../../admin/periodo";
import type { FilaReserva, ReservaManual } from "../../admin/tipos";
import { ocupa } from "../../admin/tipos";
import { useAviso } from "../../context/Toast";
import { CLAVE_DESCUENTOS, hoyISO, leerDescuentos } from "../../utils";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import FiltroPeriodo from "./FiltroPeriodo";

interface Props { juegos: ApiJuego[]; filas: FilaReserva[]; manuales: ReservaManual[]; setManuales: (l: ReservaManual[]) => void; recargar: () => Promise<void>; }

// Exportar e importar una copia de los datos (juegos, bloqueos, reservas manuales y descuentos)
export default function RespaldoTab({ juegos, filas, manuales, setManuales, recargar }: Props) {
  const aviso = useAviso();
  const archivo = useRef<HTMLInputElement>(null);
  const [resumen, setResumen] = useState("");
  const [trabajando, setTrabajando] = useState(false);
  const [periodo, setPeriodo] = useState<Periodo>(() => periodoInicial(hoyISO()));
  const [conCatalogo, setConCatalogo] = useState(true);
  const rango = useMemo(() => rangoDe(periodo), [periodo]);
  const copia = useMemo(() => armarCopia(juegos, manuales, leerDescuentos(), { rango, incluirJuegosYDescuentos: conCatalogo, filas }), [juegos, manuales, filas, rango, conCatalogo]);

  const exportar = () => {
    const copiaActual = armarCopia(juegos, manuales, leerDescuentos(), { rango, incluirJuegosYDescuentos: conCatalogo, filas });
    const url = URL.createObjectURL(new Blob([JSON.stringify(copiaActual, null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    const sufijo = rango ? `-${rango.desde > "0000-01-01" ? rango.desde : "inicio"}_a_${rango.hasta < "9999-12-31" ? rango.hasta : "hoy"}` : "";
    a.href = url; a.download = `juegaya-copia${sufijo}-${copiaActual.exportadoEn.slice(0, 10)}.json`; a.click();
    URL.revokeObjectURL(url);
    aviso("Copia exportada");
  };

  const importar = async (f: File | undefined) => {
    if (!f) return;
    setTrabajando(true); setResumen("");
    try {
      const c = validarCopia(await f.text());
      const periodoCopia = c.alcance?.tipo === "periodo" ? ` (período ${c.alcance.desde ?? "inicio"} a ${c.alcance.hasta ?? "hoy"})` : "";
      const toca = c.alcance?.incluyeJuegosYDescuentos === false ? "No incluye juegos ni descuentos, así que esos no se tocan." : "Los descuentos se reemplazan por los de la copia.";
      if (!confirm(`Importar la copia del ${c.exportadoEn.slice(0, 10)}${periodoCopia}?\nLas reservas manuales de la copia se agregan o actualizan; las demás se mantienen. ${toca} Los juegos y fechas que falten se crean; los que ya existen no se tocan.`)) return;
      const existentes = await apiCatalogo.listarTodos();
      let juegosNuevos = 0, bloqueosNuevos = 0;
      for (const j of c.juegos) {
        if (existentes.some(e => e.id === j.id || e.nombre.toLowerCase() === j.nombre.toLowerCase())) continue;
        await apiCatalogo.crear({ nombre: j.nombre, categoria: j.categoria, precioJornada: j.precioJornada, descripcion: j.descripcion || undefined, imagenUrl: j.imagenUrl || undefined, capacidad: j.capacidad || undefined, activo: j.activo });
        juegosNuevos++;
      }
      // los ids de juego pueden cambiar al recrearlos: busco por nombre en la lista actualizada
      const actuales = await apiCatalogo.listarTodos();
      const idActual = (idCopia: string) => { const n = c.juegos.find(j => j.id === idCopia)?.nombre.toLowerCase(); return actuales.find(a => a.id === idCopia || a.nombre.toLowerCase() === n)?.id; };
      for (const b of c.bloqueosManuales) {
        const id = idActual(b.juegoId); if (!id) continue;
        try { await apiCatalogo.bloquear(id, b.fecha); bloqueosNuevos++; } catch { /* ya estaba ocupada */ }
      }
      let omitidas = 0;
      const reservas: ReservaManual[] = [];
      for (const r of c.reservasManuales) {
        const id = idActual(r.juegoId);
        if (!id) { omitidas++; continue; }
        const nueva = { ...r, juegoId: id };
        if (ocupa(nueva.estado)) { try { await apiCatalogo.bloquear(id, nueva.fecha, nueva.bloqueoId); } catch { /* ya estaba bloqueada */ } }
        reservas.push(nueva);
      }
      const idsCopia = new Set(reservas.map(r => r.id));
      setManuales([...reservas, ...manuales.filter(m => !idsCopia.has(m.id))]);
      const conDescuentos = c.alcance?.incluyeJuegosYDescuentos !== false;
      if (conDescuentos) { try { localStorage.setItem(CLAVE_DESCUENTOS, JSON.stringify(c.descuentos)); } catch { /* sin storage */ } }
      setResumen(`Importado: ${juegosNuevos} juego(s) nuevos, ${bloqueosNuevos} fecha(s) bloqueadas, ${reservas.length} reserva(s) manuales${conDescuentos ? `, ${c.descuentos.length} descuento(s)` : ""}${omitidas ? `; ${omitidas} reserva(s) omitidas porque su juego no existe` : ""}.`);
      aviso("Copia importada"); await recargar();
    } catch (e) { aviso((e as Error).message); }
    finally { setTrabajando(false); if (archivo.current) archivo.current.value = ""; }
  };

  const cuentaFechas = rango ? juegos.flatMap(j => j.bloqueos).filter(b => b.reservaId === null && enRango(b.fecha, rango)).length : null;
  return (
    <div className="tw:flex tw:flex-col tw:gap-5">
      <Card>
        <CardHeader><CardTitle>Exportar copia</CardTitle><CardDescription>Elige si la copia es general o solo de un período. El período filtra por la fecha del evento.</CardDescription></CardHeader>
        <CardContent className="tw:flex tw:flex-col tw:gap-4">
          <FiltroPeriodo valor={periodo} onChange={setPeriodo} etiquetaTodo="General" />
          <label className="tw:flex tw:cursor-pointer tw:items-center tw:gap-2 tw:text-sm" htmlFor="incluirCatalogo">
            <input id="incluirCatalogo" type="checkbox" className="tw:size-4 tw:accent-primary" checked={conCatalogo} onChange={e => setConCatalogo(e.target.checked)} />
            Incluir juegos y descuentos (no dependen de la fecha: van completos)
          </label>
          <div className="tw:rounded-lg tw:bg-muted tw:px-4 tw:py-3 tw:text-sm" data-testid="vistaPrevia" role="status">
            <strong>Se exportará:</strong> {copia.juegos.length} juego(s), {copia.reservasManuales.length} reserva(s) manual(es), {cuentaFechas ?? copia.bloqueosManuales.length} fecha(s) bloqueada(s), {copia.descuentos.length} descuento(s) y {copia.reservasClientes?.length ?? 0} reserva(s) de clientes
            <span className="tw:text-muted-foreground"> (estas últimas quedan solo como registro: no se vuelven a importar)</span>.
          </div>
          <div><Button onClick={exportar}><i className="bi bi-download"></i> Exportar copia</Button></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Importar copia</CardTitle><CardDescription>Sirve tanto para copias generales como de un período: lo que ya tienes y no viene en el archivo se conserva.</CardDescription></CardHeader>
        <CardContent>
          <Button variant="outline" disabled={trabajando} onClick={() => archivo.current?.click()}><i className="bi bi-upload"></i> {trabajando ? "Importando..." : "Importar copia"}</Button>
          <input ref={archivo} type="file" accept="application/json" hidden aria-label="Archivo de copia" onChange={e => importar(e.target.files?.[0])} />
          {resumen && <div className="alert alert-success mt-3 mb-0" role="status" id="resumenImportacion">{resumen}</div>}
        </CardContent>
      </Card>
    </div>
  );
}
