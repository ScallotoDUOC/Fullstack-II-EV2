
/** Categorías de juego que maneja el admin. */
export type Categoria = "Inflable" | "Acuático" | "Interior";

/** Un juego del catálogo. */
export interface Juego {
  id: string;
  nombre: string;
  categoria: Categoria;
  /** Precio por jornada completa (6 horas), en pesos chilenos. */
  precio: number;
  descripcion: string;
  /** Si es false, el juego no se muestra en el catálogo del cliente. */
  activo: boolean;
}

/** Estado del ciclo de vida de una reserva. */
export type EstadoReserva = "pendiente" | "confirmada" | "completada" | "cancelada";

/** Estado de pago de una reserva (independiente del estado de la reserva). */
export type EstadoPago = "sin_pagar" | "parcial" | "pagado";

/** Un ítem del checklist que se completa al retirar el juego. */
export interface ChecklistItem {
  texto: string;
  hecho: boolean;
}

/** Checklist de retiro de una reserva (null si todavía no se ha hecho). */
export interface ChecklistRetiro {
  /** Fecha/hora ISO en que se completó el checklist. */
  fecha: string;
  items: ChecklistItem[];
  notas: string;
}

/** Una reserva hecha por un cliente. */
export interface Reserva {
  id: string;
  /** Código corto tipo "JY-4F2KQ" que ve el cliente. */
  codigo: string;
  cliente: string;
  telefono: string;
  juegoId: string;
  /** Fecha del evento, en formato ISO "YYYY-MM-DD". */
  fecha: string;
  /** Entre 1 y 6 (una jornada completa). */
  horas: number;
  /** Precio total de la reserva (precioHora del juego × horas). */
  total: number;
  estado: EstadoReserva;
  estadoPago: EstadoPago;
  /** Vehículo asignado para la entrega (vacío si no se ha asignado). */
  vehiculo: string;
  /** Persona responsable de la entrega (vacío si no se ha asignado). */
  responsable: string;
  checklistRetiro: ChecklistRetiro | null;
}

/** Estado de un reclamo de cliente. */
export type EstadoReclamo = "pendiente" | "cerrado";

export interface Reclamo {
  id: string;
  cliente: string;
  telefono: string;
  asunto: string;
  mensaje: string;
  /** Fecha ISO "YYYY-MM-DD" en que se registró. */
  fecha: string;
  estado: EstadoReclamo;
  /** Respuesta del admin (vacía mientras esté pendiente). */
  respuesta: string;
}

/** Estado de una reseña reportada para moderación. */
export type EstadoResena = "pendiente" | "aprobada" | "eliminada";

export interface ResenaReportada {
  id: string;
  juegoId: string;
  autor: string;
  comentario: string;
  estrellas?: number;
  /** Por qué se reportó (ej: "Lenguaje ofensivo"). */
  motivo: string;
  estado: EstadoResena;
}

/** Tipo de cálculo de un código de descuento. */
export type TipoDescuento = "porcentaje" | "fijo";

export interface Descuento {
  id: string;
  codigo: string;
  tipo: TipoDescuento;
  /** Si tipo es "porcentaje", es un número 0-100 (ej: 10 = 10%). Si es "fijo", son pesos chilenos. */
  valor: number;
  activo: boolean;
}

/** Mensaje de un cliente en la bandeja centralizada del admin. */
export interface Mensaje {
  id: string;
  cliente: string;
  telefono: string;
  mensaje: string;
  /** Fecha ISO "YYYY-MM-DD" en que se recibió. */
  fecha: string;
  respondido: boolean;
  respuesta: string;
}

/** Una línea del historial de cambios del sistema. */
export interface HistorialEntry {
  id: string;
  /** Fecha/hora completa en ISO (con horas y minutos, a diferencia de las demás fechas). */
  fecha: string;
  accion: string;
  detalle: string;
}

/** Todo lo que guarda admin.html en localStorage, bajo la clave "juegaya-admin-v1". */
export interface DatosAdmin {
  juegos: Juego[];
  reservas: Reserva[];
  reclamos: Reclamo[];
  resenasReportadas: ResenaReportada[];
  descuentos: Descuento[];
  mensajes: Mensaje[];
  historial: HistorialEntry[];
}

/** Una cuenta de cliente, guardada en localStorage bajo "juegaya_usuarios". */
export interface Usuario {
  nombre: string;
  email: string;
  /** Texto plano en este prototipo; en un backend real iría encriptada y no viajaría al cliente. */
  password: string;
}

/** La sesión activa del cliente, guardada bajo "juegaya_sesion". */
export interface SesionCliente {
  nombre: string;
  email: string;
}

/** Un juego agregado al carrito de compra del cliente (estado en memoria, no se persiste). */
export interface ItemCarrito {
  id: string;
  nombre: string;
  horas: number;
  precioHora: number;
  /** precioHora × horas. */
  precio: number;
}

/** El perfil de un cliente, calculado a partir de sus reservas (no se guarda aparte). */
export interface PerfilCliente {
  nombre: string;
  telefono: string;
  reservas: Reserva[];
  cantidad: number;
  /** Suma de `total` de las reservas confirmadas o completadas. */
  gastado: number;
  /** Fecha (ISO) de la reserva más reciente, o undefined si no tiene ninguna. */
  ultima?: string;
}

/** Fila de un reporte de productos arrendados, agrupado por juego. */
export interface ReporteProducto {
  juegoId: string;
  veces: number;
  horas: number;
  ingresos: number;
}

// ============================================================================
// Consultas sobre juegos
// ============================================================================

/** Los juegos visibles para los clientes (activo === true). */
export function obtenerJuegosActivos(juegos: Juego[]): Juego[] {
  return juegos.filter(j => j.activo);
}

/** Busca un juego por id, o undefined si no existe (o fue eliminado). */
export function obtenerJuegoPorId(juegos: Juego[], id: string): Juego | undefined {
  return juegos.find(j => j.id === id);
}

/** Juegos de una categoría específica. */
export function obtenerJuegosPorCategoria(juegos: Juego[], categoria: Categoria): Juego[] {
  return juegos.filter(j => j.categoria === categoria);
}

/** Precio por hora de un juego (la jornada completa son 6 horas), redondeado al peso. */
export function precioPorHora(juego: Juego): number {
  return Math.round(juego.precio / 6);
}

/** Busca juegos cuyo nombre contenga el texto dado (sin distinguir mayúsculas). */
export function buscarJuegosPorNombre(juegos: Juego[], texto: string): Juego[] {
  const t = texto.trim().toLowerCase();
  if (!t) return juegos;
  return juegos.filter(j => j.nombre.toLowerCase().includes(t));
}

/** Juegos cuyo precio por jornada cae dentro del rango [min, max]. */
export function filtrarJuegosPorPrecio(juegos: Juego[], min: number, max: number): Juego[] {
  return juegos.filter(j => j.precio >= min && j.precio <= max);
}

// ============================================================================
// Consultas sobre reservas
// ============================================================================

/** Una reserva "ocupa" el juego ese día si está pendiente o confirmada (no cancelada ni completada). */
export function ocupaFecha(reserva: Reserva): boolean {
  return reserva.estado === "pendiente" || reserva.estado === "confirmada";
}

/** Reservas que coinciden con el estado dado (o todas, si no se pasa estado). */
export function obtenerReservasPorEstado(reservas: Reserva[], estado?: EstadoReserva): Reserva[] {
  return estado ? reservas.filter(r => r.estado === estado) : reservas;
}

/** Reservas de un juego específico. */
export function obtenerReservasPorJuego(reservas: Reserva[], juegoId: string): Reserva[] {
  return reservas.filter(r => r.juegoId === juegoId);
}

/** Reservas cuya fecha cae dentro de [desde, hasta] (ambos ISO "YYYY-MM-DD", inclusive; cualquiera es opcional). */
export function obtenerReservasEnRango(reservas: Reserva[], desde?: string, hasta?: string): Reserva[] {
  return reservas.filter(r => (!desde || r.fecha >= desde) && (!hasta || r.fecha <= hasta));
}

/**
 * Revisa si ya existe una reserva activa (pendiente o confirmada) para el mismo juego y la misma fecha.
 * Se usa antes de crear o editar una reserva, para no reservar dos veces el mismo juego físico el mismo día.
 * `ignorarId` se pasa al editar una reserva existente, para no chocar consigo misma.
 */
export function hayChoqueDisponibilidad(reservas: Reserva[], juegoId: string, fecha: string, ignorarId?: string): boolean {
  return reservas.some(r => r.juegoId === juegoId && r.fecha === fecha && ocupaFecha(r) && r.id !== ignorarId);
}

/** Próximas reservas activas (pendiente o confirmada) a partir de una fecha, ordenadas por fecha ascendente. */
export function obtenerProximasReservas(reservas: Reserva[], desdeISO: string, limite = 5): Reserva[] {
  return reservas
    .filter(r => ocupaFecha(r) && r.fecha >= desdeISO)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .slice(0, limite);
}

/** Agrupa las reservas activas por fecha (clave = fecha ISO), útil para pintar un calendario. */
export function agruparReservasPorFecha(reservas: Reserva[]): Record<string, Reserva[]> {
  const mapa: Record<string, Reserva[]> = {};
  reservas.filter(r => r.estado !== "cancelada").forEach(r => {
    (mapa[r.fecha] ??= []).push(r);
  });
  return mapa;
}

// ============================================================================
// Perfil de clientes (derivado de las reservas, no se guarda aparte)
// ============================================================================

/** Arma el perfil de cada cliente agrupando sus reservas por teléfono (o por nombre, si no hay teléfono). */
export function clientesDerivados(reservas: Reserva[]): PerfilCliente[] {
  const mapa = new Map<string, PerfilCliente>();

  reservas.forEach(r => {
    const clave = r.telefono || r.cliente;
    const existente = mapa.get(clave);
    if (existente) {
      existente.nombre = r.cliente; // me quedo con el nombre más reciente que escribieron
      existente.reservas.push(r);
    } else {
      mapa.set(clave, { nombre: r.cliente, telefono: r.telefono, reservas: [r], cantidad: 0, gastado: 0 });
    }
  });

  return Array.from(mapa.values()).map(c => ({
    ...c,
    cantidad: c.reservas.length,
    gastado: c.reservas.filter(r => r.estado === "confirmada" || r.estado === "completada").reduce((t, r) => t + r.total, 0),
    ultima: c.reservas.map(r => r.fecha).sort().slice(-1)[0]
  }));
}

/** Busca el perfil de un cliente por teléfono, dentro de los ya calculados con `clientesDerivados`. */
export function obtenerClientePorTelefono(perfiles: PerfilCliente[], telefono: string): PerfilCliente | undefined {
  return perfiles.find(c => c.telefono === telefono);
}

/** Filtra perfiles de clientes cuyo nombre o teléfono contenga el texto dado. */
export function buscarClientes(perfiles: PerfilCliente[], texto: string): PerfilCliente[] {
  const t = texto.trim().toLowerCase();
  if (!t) return perfiles;
  return perfiles.filter(c => `${c.nombre} ${c.telefono}`.toLowerCase().includes(t));
}

// ============================================================================
// Reclamos
// ============================================================================

export function obtenerReclamosPorEstado(reclamos: Reclamo[], estado?: EstadoReclamo): Reclamo[] {
  return estado ? reclamos.filter(r => r.estado === estado) : reclamos;
}

export function contarReclamosPendientes(reclamos: Reclamo[]): number {
  return reclamos.filter(r => r.estado === "pendiente").length;
}

// ============================================================================
// Reseñas reportadas
// ============================================================================

export function obtenerResenasPendientes(resenas: ResenaReportada[]): ResenaReportada[] {
  return resenas.filter(r => r.estado === "pendiente");
}

// ============================================================================
// Descuentos
// ============================================================================

/** Los códigos de descuento activos (los que puede usar un cliente al reservar). */
export function obtenerDescuentosActivos(descuentos: Descuento[]): Descuento[] {
  return descuentos.filter(d => d.activo);
}

/** Busca un código de descuento activo por su código (sin distinguir mayúsculas), o undefined si no existe o está inactivo. */
export function buscarDescuentoActivo(descuentos: Descuento[], codigo: string): Descuento | undefined {
  const c = codigo.trim().toUpperCase();
  return descuentos.find(d => d.activo && d.codigo.toUpperCase() === c);
}

/** Calcula cuánto se descuenta de un subtotal, dado un código de descuento. */
export function calcularMontoDescuento(descuento: Descuento, subtotal: number): number {
  return descuento.tipo === "porcentaje" ? Math.round(subtotal * (descuento.valor / 100)) : descuento.valor;
}

// ============================================================================
// Mensajes de clientes
// ============================================================================

export function obtenerMensajesPendientes(mensajes: Mensaje[]): Mensaje[] {
  return mensajes.filter(m => !m.respondido);
}

// ============================================================================
// Reportes e ingresos
// ============================================================================

/** Suma el `total` de las reservas confirmadas o completadas dentro de un rango de fechas (ambos límites inclusive). */
export function calcularIngresosPorPeriodo(reservas: Reserva[], desde: string, hasta: string): number {
  return reservas
    .filter(r => (r.estado === "confirmada" || r.estado === "completada") && r.fecha >= desde && r.fecha <= hasta)
    .reduce((total, r) => total + r.total, 0);
}

/** Cuántas reservas confirmadas o completadas caen dentro de un rango de fechas. */
export function contarReservasPorPeriodo(reservas: Reserva[], desde: string, hasta: string): number {
  return reservas.filter(r => (r.estado === "confirmada" || r.estado === "completada") && r.fecha >= desde && r.fecha <= hasta).length;
}

/** Reporte de productos arrendados: veces, horas totales e ingresos generados, agrupado por juego. */
export function calcularReporteProductos(reservas: Reserva[]): ReporteProducto[] {
  const mapa = new Map<string, ReporteProducto>();

  reservas
    .filter(r => r.estado === "confirmada" || r.estado === "completada")
    .forEach(r => {
      const fila = mapa.get(r.juegoId) ?? { juegoId: r.juegoId, veces: 0, horas: 0, ingresos: 0 };
      fila.veces += 1;
      fila.horas += r.horas;
      fila.ingresos += r.total;
      mapa.set(r.juegoId, fila);
    });

  return Array.from(mapa.values()).sort((a, b) => b.ingresos - a.ingresos);
}

// ============================================================================
// Historial de cambios
// ============================================================================

/** Las N líneas más recientes del historial (ya vienen ordenadas del más nuevo al más viejo al guardarse). */
export function obtenerHistorialReciente(historial: HistorialEntry[], limite = 20): HistorialEntry[] {
  return historial.slice(0, limite);
}

// ============================================================================
// Carrito del cliente (lado app.js)
// ============================================================================

/** Subtotal del carrito: suma de `precio` de cada ítem. */
export function calcularSubtotalCarrito(carrito: ItemCarrito[]): number {
  return carrito.reduce((total, item) => total + item.precio, 0);
}

/** Revisa si un juego ya está en el carrito (no se puede agregar dos veces el mismo). */
export function estaEnCarrito(carrito: ItemCarrito[], juegoId: string): boolean {
  return carrito.some(item => item.id === juegoId);
}

// ============================================================================
// Cuentas de cliente (lado app.js)
// ============================================================================

/** Busca un usuario registrado por correo (sin distinguir mayúsculas). */
export function obtenerUsuarioPorEmail(usuarios: Usuario[], email: string): Usuario | undefined {
  const e = email.trim().toLowerCase();
  return usuarios.find(u => u.email.toLowerCase() === e);
}

/** Valida credenciales de login contra la lista de usuarios registrados. */
export function validarCredenciales(usuarios: Usuario[], email: string, password: string): Usuario | undefined {
  const e = email.trim().toLowerCase();
  return usuarios.find(u => u.email.toLowerCase() === e && u.password === password);
}
