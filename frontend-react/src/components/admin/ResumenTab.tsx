import { useMemo, useState } from "react";
import { desglosar, enRango, etiquetaPeriodo, periodoInicial, rangoDe } from "../../admin/periodo";
import type { Periodo } from "../../admin/periodo";
import { fechaLarga, ocupa } from "../../admin/tipos";
import type { FilaReserva } from "../../admin/tipos";
import type { ApiJuego } from "../../api/api";
import { clp, hoyISO } from "../../utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import EstadoBadge from "./EstadoBadge";
import FiltroPeriodo from "./FiltroPeriodo";

interface Props { filas: FilaReserva[]; juegos: ApiJuego[]; }

function Indicador({ titulo, valor }: { titulo: string; valor: string | number }) {
  return (
    <Card><div className="tw:px-5 tw:py-4">
      <div className="tw:text-xs tw:font-medium tw:text-muted-foreground">{titulo}</div>
      <div className="tw:mt-1 tw:text-2xl tw:font-bold tw:tracking-tight">{valor}</div>
    </div></Card>
  );
}

function Barra({ proporcion }: { proporcion: number }) {
  return <div className="tw:h-2 tw:w-full tw:overflow-hidden tw:rounded-full tw:bg-muted"><div className="tw:h-full tw:rounded-full tw:bg-primary" style={{ width: `${Math.max(proporcion * 100, proporcion > 0 ? 3 : 0)}%` }} /></div>;
}

// Resumen de reservas e ingresos filtrable por período (todo, año, mes, semana, día o rango) + desglose y eventos
export default function ResumenTab({ filas, juegos }: Props) {
  const hoy = hoyISO();
  const [periodo, setPeriodo] = useState<Periodo>(() => periodoInicial(hoy));
  const rango = useMemo(() => rangoDe(periodo), [periodo]);
  const delPeriodo = useMemo(() => filas.filter(f => enRango(f.fecha, rango)), [filas, rango]);
  const nombre = (id: string) => juegos.find(j => j.id === id)?.nombre || "Juego eliminado";

  const vigentes = delPeriodo.filter(f => f.estado !== "cancelada");
  const pagadas = delPeriodo.filter(f => f.estado === "confirmada" || f.estado === "completada");
  const ingresos = pagadas.reduce((t, f) => t + f.total, 0);
  const { unidad, tramos } = useMemo(() => desglosar(delPeriodo, rango), [delPeriodo, rango]);
  const maxReservas = Math.max(1, ...tramos.map(t => t.reservas));

  const porJuego = useMemo(() => {
    const m = new Map<string, number>();
    for (const f of vigentes) for (const id of f.juegoIds) m.set(id, (m.get(id) || 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [vigentes]);

  const eventos = delPeriodo.filter(f => ocupa(f.estado) && (periodo.modo !== "todo" || f.fecha >= hoy)).sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(0, periodo.modo === "todo" ? 5 : 10);

  return (
    <div className="tw:flex tw:flex-col tw:gap-5">
      <Card><CardContent><FiltroPeriodo valor={periodo} onChange={setPeriodo} /></CardContent></Card>

      <div className="tw:grid tw:grid-cols-2 tw:gap-3 tw:lg:grid-cols-3" data-testid="indicadores">
        <Indicador titulo="Reservas del período" valor={vigentes.length} />
        <Indicador titulo="Reservas por confirmar" valor={delPeriodo.filter(f => f.estado === "pendiente").length} />
        <Indicador titulo="Reservas confirmadas" valor={pagadas.length} />
        <Indicador titulo="Reservas canceladas" valor={delPeriodo.filter(f => f.estado === "cancelada").length} />
        <Indicador titulo="Ingresos confirmados" valor={clp(ingresos)} />
        <Indicador titulo="Ticket promedio" valor={pagadas.length ? clp(Math.round(ingresos / pagadas.length)) : "—"} />
      </div>

      <div className="tw:grid tw:gap-5 tw:lg:grid-cols-5">
        <Card className="tw:lg:col-span-3">
          <CardHeader><CardTitle>Desglose por {unidad}</CardTitle><CardDescription>Reservas e ingresos confirmados — {etiquetaPeriodo(periodo)}</CardDescription></CardHeader>
          <CardContent>
            {!tramos.length ? <p className="tw:m-0 tw:text-sm tw:text-muted-foreground">No hay reservas en este período.</p> : (
              <ul className="tw:m-0 tw:flex tw:list-none tw:flex-col tw:gap-2.5 tw:p-0" data-testid="desglose">
                {tramos.map(t => (
                  <li key={t.clave} className="tw:grid tw:grid-cols-[6.5rem_1fr_auto] tw:items-center tw:gap-3 tw:text-sm">
                    <span className="tw:text-muted-foreground">{t.etiqueta}</span>
                    <Barra proporcion={t.reservas / maxReservas} />
                    <span className="tw:whitespace-nowrap tw:text-right"><strong>{t.reservas}</strong> · {clp(t.ingresos)}</span>
                  </li>))}
              </ul>)}
          </CardContent>
        </Card>
        <Card className="tw:lg:col-span-2">
          <CardHeader><CardTitle>Juegos más reservados</CardTitle><CardDescription>Top 5 del período</CardDescription></CardHeader>
          <CardContent>
            {!porJuego.length ? <p className="tw:m-0 tw:text-sm tw:text-muted-foreground">Sin datos en este período.</p> : (
              <ul className="tw:m-0 tw:flex tw:list-none tw:flex-col tw:gap-3 tw:p-0">
                {porJuego.map(([id, n]) => (
                  <li key={id} className="tw:flex tw:flex-col tw:gap-1 tw:text-sm">
                    <div className="tw:flex tw:justify-between"><span>{nombre(id)}</span><strong>{n}</strong></div>
                    <Barra proporcion={n / porJuego[0][1]} />
                  </li>))}
              </ul>)}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>{periodo.modo === "todo" ? "Próximos eventos" : "Eventos del período"}</CardTitle><CardDescription>Reservas pendientes o confirmadas, de la más cercana a la más lejana</CardDescription></CardHeader>
        <CardContent>
          {!eventos.length ? <p className="tw:m-0 tw:text-sm tw:text-muted-foreground">No hay eventos para mostrar.</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Cliente</TableHead><TableHead>Juegos</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
              <TableBody>{eventos.map(f => (
                <TableRow key={f.key}><TableCell label="Fecha">{fechaLarga(f.fecha)}</TableCell><TableCell label="Cliente">{f.cliente}</TableCell><TableCell label="Juegos">{f.juegoIds.map(nombre).join(", ")}</TableCell><TableCell label="Estado"><EstadoBadge estado={f.estado} /></TableCell></TableRow>))}</TableBody>
            </Table>)}
        </CardContent>
      </Card>
    </div>
  );
}
