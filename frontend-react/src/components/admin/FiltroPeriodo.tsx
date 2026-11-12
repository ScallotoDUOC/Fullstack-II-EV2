import { etiquetaPeriodo, MESES } from "../../admin/periodo";
import type { ModoPeriodo, Periodo } from "../../admin/periodo";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { NativeSelect } from "../ui/native-select";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";

interface Props { valor: Periodo; onChange: (p: Periodo) => void; etiquetaTodo?: string; }

const MODOS: [ModoPeriodo, string][] = [["todo", "Todo"], ["anio", "Año"], ["mes", "Mes"], ["semana", "Semana"], ["dia", "Día"], ["rango", "Rango"]];

// Selector de período reutilizable (Resumen y Copia de datos): todo, año, mes, semana, un día o un rango de fechas
export default function FiltroPeriodo({ valor, onChange, etiquetaTodo = "Todo" }: Props) {
  const set = (cambios: Partial<Periodo>) => onChange({ ...valor, ...cambios });
  return (
    <div className="tw:flex tw:flex-col tw:gap-3">
      <Tabs value={valor.modo} onValueChange={m => set({ modo: m as ModoPeriodo })}>
        <TabsList aria-label="Tipo de período">
          {MODOS.map(([m, t]) => <TabsTrigger key={m} value={m}>{m === "todo" ? etiquetaTodo : t}</TabsTrigger>)}
        </TabsList>
      </Tabs>
      <div className="tw:flex tw:flex-wrap tw:items-end tw:gap-3">
        {valor.modo === "anio" && (
          <div className="tw:w-32"><Label htmlFor="pAnio">Año</Label>
            <Input id="pAnio" type="number" min={2000} max={2100} value={valor.anio} onChange={e => set({ anio: Number(e.target.value) || valor.anio })} /></div>)}
        {valor.modo === "mes" && (
          <>
            <div className="tw:w-44"><Label htmlFor="pMes">Mes</Label>
              <NativeSelect id="pMes" value={valor.mes} onChange={e => set({ mes: Number(e.target.value) })}>{MESES.map((m, i) => <option key={m} value={i + 1}>{m[0].toUpperCase() + m.slice(1)}</option>)}</NativeSelect></div>
            <div className="tw:w-28"><Label htmlFor="pMesAnio">Año</Label>
              <Input id="pMesAnio" type="number" min={2000} max={2100} value={valor.anio} onChange={e => set({ anio: Number(e.target.value) || valor.anio })} /></div>
          </>)}
        {valor.modo === "semana" && (
          <div className="tw:w-48"><Label htmlFor="pSemana">Cualquier día de esa semana</Label>
            <Input id="pSemana" type="date" value={valor.dia} onChange={e => set({ dia: e.target.value })} /></div>)}
        {valor.modo === "dia" && (
          <div className="tw:w-48"><Label htmlFor="pDia">Día</Label>
            <Input id="pDia" type="date" value={valor.dia} onChange={e => set({ dia: e.target.value })} /></div>)}
        {valor.modo === "rango" && (
          <>
            <div className="tw:w-44"><Label htmlFor="pDesde">Desde</Label><Input id="pDesde" type="date" value={valor.desde} max={valor.hasta || undefined} onChange={e => set({ desde: e.target.value })} /></div>
            <div className="tw:w-44"><Label htmlFor="pHasta">Hasta</Label><Input id="pHasta" type="date" value={valor.hasta} min={valor.desde || undefined} onChange={e => set({ hasta: e.target.value })} /></div>
          </>)}
        <p className="tw:m-0 tw:pb-2 tw:text-sm tw:text-muted-foreground" id="etiquetaPeriodo">
          Mostrando: <strong className="tw:text-foreground">{valor.modo === "todo" ? etiquetaTodo === "Todo" ? "todo el tiempo" : etiquetaTodo.toLowerCase() : etiquetaPeriodo(valor)}</strong>
        </p>
      </div>
    </div>
  );
}
