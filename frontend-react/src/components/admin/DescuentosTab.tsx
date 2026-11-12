import { useState } from "react";
import type { FormEvent } from "react";
import { useAviso } from "../../context/Toast";
import { CLAVE_DESCUENTOS, clp, leerDescuentos } from "../../utils";
import type { Descuento } from "../../utils";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";

// Códigos de descuento (se guardan en este navegador; el carrito del cliente los usa como estimación)
export default function DescuentosTab() {
  const aviso = useAviso();
  const [lista, setLista] = useState<Descuento[]>(leerDescuentos);
  const [d, setD] = useState<Descuento>({ codigo: "", tipo: "porcentaje", valor: 10, activo: true });
  const guardar = (l: Descuento[]) => { setLista(l); try { localStorage.setItem(CLAVE_DESCUENTOS, JSON.stringify(l)); } catch { aviso("Este navegador no permite guardar"); } };
  const agregar = (e: FormEvent) => {
    e.preventDefault();
    const codigo = d.codigo.trim().toUpperCase();
    if (!codigo || d.valor <= 0 || (d.tipo === "porcentaje" && d.valor > 100)) { aviso("Revisa el código y el valor"); return; }
    if (lista.some(x => x.codigo === codigo)) { aviso("Ese código ya existe"); return; }
    guardar([...lista, { ...d, codigo }]); setD({ ...d, codigo: "" });
  };
  return (
    <>
      <form className="row g-2 mb-4" onSubmit={agregar}>
        <div className="col-md-4"><input required placeholder="Código (ej: NAVIDAD15)" aria-label="Código" className="form-control" value={d.codigo} onChange={e => setD({ ...d, codigo: e.target.value })} /></div>
        <div className="col-md-3"><select aria-label="Tipo" className="form-select" value={d.tipo} onChange={e => setD({ ...d, tipo: e.target.value as Descuento["tipo"] })}><option value="porcentaje">Porcentaje (%)</option><option value="fijo">Monto fijo ($)</option></select></div>
        <div className="col-md-3"><input type="number" min={1} aria-label="Valor" className="form-control" value={d.valor} onChange={e => setD({ ...d, valor: Number(e.target.value) })} /></div>
        <div className="col-md-2"><button className="btn btn-primary w-100">Agregar</button></div>
      </form>
      <Card><Table>
        <TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Descuento</TableHead><TableHead>Activo</TableHead><TableHead></TableHead></TableRow></TableHeader>
        <TableBody>{lista.map(x => (
          <TableRow key={x.codigo}><TableCell label="Código"><strong>{x.codigo}</strong></TableCell><TableCell label="Descuento">{x.tipo === "porcentaje" ? `${x.valor}%` : clp(x.valor)}</TableCell>
            <TableCell label="Activo"><div className="form-check form-switch"><input className="form-check-input" type="checkbox" aria-label={`Activar ${x.codigo}`} checked={x.activo} onChange={e => guardar(lista.map(y => (y.codigo === x.codigo ? { ...y, activo: e.target.checked } : y)))} /></div></TableCell>
            <TableCell className="tw:text-right"><span className="tw:inline-flex"><Button size="sm" variant="destructive" onClick={() => guardar(lista.filter(y => y.codigo !== x.codigo))}>Borrar</Button></span></TableCell></TableRow>))}</TableBody>
      </Table></Card>
    </>
  );
}
