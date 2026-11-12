import type { EstadoReserva } from "../../admin/tipos";
import { ESTADOS } from "../../admin/tipos";
import { Badge } from "../ui/badge";
import type { VarianteBadge } from "../ui/badge";

const VARIANTE: Record<EstadoReserva, VarianteBadge> = { pendiente: "warning", confirmada: "success", completada: "info", cancelada: "neutral" };

export default function EstadoBadge({ estado }: { estado: EstadoReserva }) {
  return <Badge variant={VARIANTE[estado]}>{ESTADOS[estado]}</Badge>;
}
