// ===================================================================
// api.ts: todo lo que habla con los microservicios (Spring Boot).
// Es un módulo: app.ts, admin.ts y reservas.ts lo importan con  import { apiCatalogo } from "./api".
//
// Si el gateway (o los servicios) corren en otro host/puerto, se puede cambiar antes de cargar los scripts con:
//   <script>window.JUEGAYA_API = { catalogo: "http://mi-host:8083", ... }</script>
// ===================================================================

export interface ApiUrls { usuarios: string; catalogo: string; pedidos: string; pagos: string; }

// Todo pasa por el API Gateway (puerto 8080), que reparte cada ruta al microservicio que corresponde:
//   /api/auth -> Usuarios, /api/catalogo -> Catalogo, /pedidos -> Pedidos, /pagos -> Pagos
const GATEWAY = "http://localhost:8080";
const API_POR_DEFECTO: ApiUrls = { usuarios: GATEWAY, catalogo: GATEWAY, pedidos: GATEWAY, pagos: GATEWAY };
export const API_URLS: ApiUrls = { ...API_POR_DEFECTO, ...((window as any).JUEGAYA_API || {}) };

// ---- tipos tal cual los devuelven los microservicios ----
export type ApiCategoria = "INFLABLE" | "ACUATICO" | "INTERIOR";

export interface ApiResena { id?: number; juegoId: string; usuarioId: number; autor: string; estrellas: number; comentario: string; fecha: string; }
export interface ApiBloqueo { id?: number; juegoId: string; fecha: string; motivo: string; reservaId: number | null; }
export interface ApiJuego {
  id: string; nombre: string; categoria: ApiCategoria; precioJornada: number;
  descripcion: string | null; imagenUrl: string | null; capacidad: string | null; activo: boolean;
  resenas: ApiResena[]; bloqueos: ApiBloqueo[];
}
export interface ApiJuegoDatos {
  nombre: string; categoria: ApiCategoria; precioJornada: number;
  descripcion?: string; imagenUrl?: string; capacidad?: string; activo: boolean;
}
export interface ApiUsuario { id: number; nombre: string; email: string; rol: "CLIENTE" | "ADMINISTRADOR"; fechaRegistro: string; }
export interface ApiLogin { token: string; expiraEn: string; usuario: ApiUsuario; }
export interface ApiItemPedido { juegoId: string; fechaEvento: string; horas: number; precioHora: number; subtotal: number; estado: string; }
export interface ApiPedido {
  id: number; codigo: string | null; usuarioId: number; estado: string;
  subtotal: number; transporte: number; descuento: number; total: number;
  comuna: string | null; items: ApiItemPedido[];
}
export interface ApiEstadoPago { pedidoId: number; estado: string; pagoId: number; }
export interface ApiPago { id: number; pedidoId: number; usuarioId: number; montoTotal: number; metodo: string; estado: string; referenciaExterna: string | null; }

// ---- fetch con manejo de errores: lanza Error con un mensaje que se puede mostrar al usuario ----
export async function apiFetch<T>(url: string, opciones: RequestInit = {}, token?: string): Promise<T> {
  const headers: Record<string, string> = { ...(opciones.headers as Record<string, string> || {}) };
  if (opciones.body) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let respuesta: Response;
  try {
    respuesta = await fetch(url, { ...opciones, headers });
  } catch (e) {
    // fetch solo falla así cuando no hay conexión con el servicio (apagado, puerto equivocado o CORS)
    throw new Error("No se pudo conectar con el servidor. ¿Están encendidos los microservicios?");
  }
  if (!respuesta.ok) {
    let mensaje = `Error ${respuesta.status}`;
    try {
      const cuerpo = await respuesta.json();
      if (cuerpo && cuerpo.errores) mensaje = Object.values(cuerpo.errores as Record<string, string>).join(". ");
      else if (cuerpo && cuerpo.mensaje) mensaje = cuerpo.mensaje;
    } catch (e) { /* la respuesta no traía JSON, dejo el mensaje por defecto */ }
    throw new Error(mensaje);
  }
  if (respuesta.status === 204) return undefined as T;
  return respuesta.json() as Promise<T>;
}

// ---- Usuarios ----
export const apiUsuarios = {
  registrar: (nombre: string, email: string, password: string) =>
    apiFetch<ApiUsuario>(`${API_URLS.usuarios}/api/auth/registro`, { method: "POST", body: JSON.stringify({ nombre, email, password }) }),
  login: (email: string, password: string) =>
    apiFetch<ApiLogin>(`${API_URLS.usuarios}/api/auth/login`, { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: (token: string) =>
    apiFetch<void>(`${API_URLS.usuarios}/api/auth/logout`, { method: "POST" }, token)
};

// ---- Catálogo ----
export const apiCatalogo = {
  listar: () => apiFetch<ApiJuego[]>(`${API_URLS.catalogo}/api/catalogo`),
  listarTodos: () => apiFetch<ApiJuego[]>(`${API_URLS.catalogo}/api/catalogo?incluirInactivos=true`),
  obtener: (id: string) => apiFetch<ApiJuego>(`${API_URLS.catalogo}/api/catalogo/${encodeURIComponent(id)}`),
  disponibles: (fechaISO: string) => apiFetch<ApiJuego[]>(`${API_URLS.catalogo}/api/catalogo/disponibles?fecha=${encodeURIComponent(fechaISO)}`),
  crear: (d: ApiJuegoDatos) => apiFetch<ApiJuego>(`${API_URLS.catalogo}/api/catalogo`, { method: "POST", body: JSON.stringify(d) }),
  editar: (id: string, d: ApiJuegoDatos) => apiFetch<ApiJuego>(`${API_URLS.catalogo}/api/catalogo/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(d) }),
  eliminar: (id: string) => apiFetch<void>(`${API_URLS.catalogo}/api/catalogo/${encodeURIComponent(id)}`, { method: "DELETE" }),
  bloquear: (id: string, fechaISO: string, reservaId: number) =>
    apiFetch<ApiBloqueo>(`${API_URLS.catalogo}/api/catalogo/${encodeURIComponent(id)}/bloqueos?fecha=${encodeURIComponent(fechaISO)}&reservaId=${reservaId}`, { method: "POST" }),
  resenar: (juegoId: string, r: { usuarioId: number; autor: string; estrellas: number; comentario: string }) =>
    apiFetch<ApiResena>(`${API_URLS.catalogo}/api/catalogo/${encodeURIComponent(juegoId)}/resenas`, { method: "POST", body: JSON.stringify(r) }),
  liberar: (reservaId: number) =>
    apiFetch<void>(`${API_URLS.catalogo}/api/catalogo/bloqueos/reserva/${reservaId}`, { method: "DELETE" })
};

// ---- Pedidos ----
export const apiPedidos = {
  crear: (usuarioId: number) => apiFetch<ApiPedido>(`${API_URLS.pedidos}/pedidos?usuarioId=${usuarioId}`, { method: "POST" }),
  obtener: (id: number) => apiFetch<ApiPedido>(`${API_URLS.pedidos}/pedidos/${id}`),
  agregarItem: (id: number, item: { juegoId: string; fechaEvento: string; horas: number; precioHora: number }) =>
    apiFetch<ApiPedido>(`${API_URLS.pedidos}/pedidos/${id}/items`, { method: "POST", body: JSON.stringify(item) }),
  confirmar: (id: number, entrega: { nombre: string; telefono: string; direccion: string; indicaciones: string }) =>
    apiFetch<ApiPedido>(`${API_URLS.pedidos}/pedidos/${id}/confirmar`, { method: "PUT", body: JSON.stringify(entrega) }),
  pagado: (id: number) => apiFetch<ApiPedido>(`${API_URLS.pedidos}/pedidos/${id}/pagado`, { method: "PUT" }),
  cancelar: (id: number) => apiFetch<ApiPedido>(`${API_URLS.pedidos}/pedidos/${id}/cancelar`, { method: "PUT" }),
  listarPorUsuario: (usuarioId: number) => apiFetch<ApiPedido[]>(`${API_URLS.pedidos}/pedidos?usuarioId=${usuarioId}`)
};

// ---- Pagos ----
export const apiPagos = {
  iniciar: (pedidoId: number, usuarioId: number, montoTotal: number, metodo: "TRANSFERENCIA" | "TARJETA") =>
    apiFetch<ApiPago>(`${API_URLS.pagos}/pagos`, { method: "POST", body: JSON.stringify({ pedidoId, usuarioId, montoTotal, metodo }) }),
  confirmar: (pagoId: number) => apiFetch<ApiPago>(`${API_URLS.pagos}/pagos/${pagoId}/confirmar`, { method: "PUT" }),
  reembolsar: (pagoId: number) => apiFetch<ApiPago>(`${API_URLS.pagos}/pagos/${pagoId}/reembolsar`, { method: "PUT" }),
  estadoDePedido: (pedidoId: number) => apiFetch<ApiEstadoPago>(`${API_URLS.pagos}/pagos/pedido/${pedidoId}/estado`)
};
