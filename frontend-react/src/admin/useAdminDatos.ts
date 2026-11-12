import { useCallback, useEffect, useMemo, useState } from "react";
import { apiCatalogo, apiUsuarios } from "../api/api";
import type { ApiJuego, ApiUsuario } from "../api/api";
import { useAuth } from "../context/Auth";
import { hoyISO } from "../utils";
import { cargarPedidos } from "./acciones";
import { guardarReservasManuales, leerReservasManuales } from "./datosLocales";
import { filaDeManual, filaDePedido } from "./tipos";
import type { FilaReserva, PedidoConPago, ReservaManual } from "./tipos";

// carga y mantiene los datos del panel: juegos (Catálogo), pedidos y pagos (Pedidos/Pagos) y reservas manuales (navegador)
export function useAdminDatos() {
  const [juegos, setJuegos] = useState<ApiJuego[]>([]);
  const [pedidos, setPedidos] = useState<PedidoConPago[]>([]);
  const [manuales, setManualesEstado] = useState<ReservaManual[]>(leerReservasManuales);
  const { sesion } = useAuth();
  const token = sesion?.token;
  const [usuarios, setUsuarios] = useState<ApiUsuario[]>([]);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  const recargar = useCallback(async () => {
    setCargando(true); setError("");
    const [j, p, u] = await Promise.allSettled([apiCatalogo.listarTodos(), cargarPedidos(), token ? apiUsuarios.listar(token) : Promise.resolve([] as ApiUsuario[])]);
    // si no se puede traer la lista de usuarios, las reservas de clientes se muestran como "Cliente #id"
    if (u.status === "fulfilled") setUsuarios(u.value);
    if (j.status === "fulfilled") setJuegos(j.value); else setError((j.reason as Error).message);
    if (p.status === "fulfilled") setPedidos(p.value); else setError(e => e || `Pedidos: ${(p.reason as Error).message}`);
    setCargando(false);
  }, [token]);
  useEffect(() => { recargar(); }, [recargar]);

  const setManuales = useCallback((l: ReservaManual[]) => { setManualesEstado(l); guardarReservasManuales(l); }, []);

  const filas: FilaReserva[] = useMemo(() => {
    const hoy = hoyISO();
    const porId = new Map(usuarios.map(u => [u.id, u]));
    const deClientes = pedidos.map(p => filaDePedido(p, hoy, porId.get(p.pedido.usuarioId))).filter((f): f is FilaReserva => f !== null);
    return [...manuales.map(filaDeManual), ...deClientes].sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [pedidos, manuales, usuarios]);

  return { juegos, pedidos, manuales, filas, error, cargando, recargar, setManuales };
}
