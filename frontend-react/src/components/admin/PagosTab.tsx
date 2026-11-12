import { useState } from "react";
import { confirmarPago, reembolsarPago } from "../../admin/acciones";
import { ESTADO_PAGO } from "../../admin/tipos";
import type { PedidoConPago } from "../../admin/tipos";
import { useAviso } from "../../context/Toast";
import { clp } from "../../utils";
import Modal from "../Modal";
import { Badge } from "../ui/badge";
import type { VarianteBadge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";

const VARIANTE_PAGO: Record<string, VarianteBadge> = { warning: "warning", success: "success", danger: "danger", info: "info", secondary: "neutral" };

interface Props { pedidos: PedidoConPago[]; recargar: () => Promise<void>; }

// Estado de pago de cada pedido, verificación del comprobante y reembolso
export default function PagosTab({ pedidos, recargar }: Props) {
  const aviso = useAviso();
  const [verificando, setVerificando] = useState<PedidoConPago | null>(null);
  const [comprobanteOk, setComprobanteOk] = useState(false);
  const [trabajando, setTrabajando] = useState(false);
  const lista = pedidos.filter(p => p.pedido.estado !== "BORRADOR").sort((a, b) => b.pedido.id - a.pedido.id);

  const ejecutar = async (accion: () => Promise<void>, ok: string) => {
    setTrabajando(true);
    try { await accion(); aviso(ok); setVerificando(null); await recargar(); }
    catch (e) { aviso((e as Error).message); } finally { setTrabajando(false); }
  };

  const reembolsar = (p: PedidoConPago) => {
    if (confirm(`¿Reembolsar el pago de la reserva ${p.pedido.codigo || "#" + p.pedido.id} por ${clp(p.pedido.total)}?`)) ejecutar(() => reembolsarPago(p), "Pago reembolsado");
  };

  return (
    <>
      {!lista.length ? <p className="text-secondary">Todavía no hay pedidos con pago.</p> : (
        <Card><Table>
          <TableHeader><TableRow><TableHead>Pedido</TableHead><TableHead>Cliente</TableHead><TableHead>Total</TableHead><TableHead>Estado del pedido</TableHead><TableHead>Estado del pago</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>{lista.map(p => {
            const ep = p.pagoEstado ? ESTADO_PAGO[p.pagoEstado] || [p.pagoEstado, "secondary"] : null;
            return (
              <TableRow key={p.pedido.id}>
                <TableCell label="Pedido"><strong>{p.pedido.codigo || `#${p.pedido.id}`}</strong></TableCell>
                <TableCell label="Cliente">Cliente #{p.pedido.usuarioId}</TableCell><TableCell label="Total">{clp(p.pedido.total)}</TableCell>
                <TableCell label="Estado del pedido">{p.pedido.estado}</TableCell>
                <TableCell label="Estado del pago">{ep ? <Badge variant={VARIANTE_PAGO[ep[1]] || "neutral"}>{ep[0]}</Badge> : <Badge variant="neutral">Sin pago</Badge>}</TableCell>
                <TableCell className="tw:text-right">
                  <span className="tw:inline-flex tw:gap-1.5">
                    {p.pagoEstado === "PENDIENTE" && p.pedido.estado !== "CANCELADO" && <Button size="sm" onClick={() => { setVerificando(p); setComprobanteOk(false); }}>Verificar y confirmar</Button>}
                    {p.pagoEstado === "APROBADO" && <Button size="sm" variant="destructive" onClick={() => reembolsar(p)}>Reembolsar</Button>}
                  </span>
                </TableCell>
              </TableRow>);
          })}</TableBody>
        </Table></Card>)}
      {verificando && (
        <Modal titulo={`Confirmar pago ${verificando.pedido.codigo || "#" + verificando.pedido.id}`} onCerrar={() => setVerificando(null)}
          pie={<button className="btn btn-success" disabled={!comprobanteOk || trabajando} onClick={() => ejecutar(() => confirmarPago(verificando), "Pago confirmado")}>{trabajando ? "Confirmando..." : "Confirmar pago"}</button>}>
          <p>Monto a recibir: <strong>{clp(verificando.pedido.total)}</strong></p>
          <p className="text-secondary small">Revisa en tu banco o en el comprobante que el cliente envió que el monto y el nombre coinciden, y recién ahí confirma.</p>
          <div className="form-check"><input id="compOk" type="checkbox" className="form-check-input" checked={comprobanteOk} onChange={e => setComprobanteOk(e.target.checked)} /><label htmlFor="compOk" className="form-check-label">Verifiqué el comprobante y el monto es correcto</label></div>
        </Modal>)}
    </>
  );
}
