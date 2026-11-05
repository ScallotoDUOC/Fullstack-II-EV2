// funciones: acá van las "consultas" de verdad, las que se usarían para leer los datos de JuegaYa
import type { Juego, Reserva, EstadoReserva } from "./03-interfaces.ts";
import { catalogo } from "./04-arreglos.ts";

// función normal, con tipo de retorno explícito
function obtenerJuegosActivos(juegos: Juego[]): Juego[] {
  return juegos.filter(j => j.activo);
}
console.log(obtenerJuegosActivos(catalogo));

// buscar por id (puede no encontrarlo, por eso devuelve Juego | undefined)
function obtenerJuegoPorId(juegos: Juego[], id: string): Juego | undefined {
  return juegos.find(j => j.id === id);
}
console.log(obtenerJuegoPorId(catalogo, "hockey"));

// arrow function con tipo de retorno, precio por hora redondeado (jornada = 6 horas)
const precioPorHora = (juego: Juego): number => Math.round(juego.precio / 6);
console.log(`Precio por hora del castillo: ${precioPorHora(catalogo[0])}`);

// búsqueda por texto, sin importar mayúsculas/minúsculas
function buscarJuegosPorNombre(juegos: Juego[], texto: string): Juego[] {
  const t = texto.trim().toLowerCase();
  return t ? juegos.filter(j => j.nombre.toLowerCase().includes(t)) : juegos;
}
console.log(buscarJuegosPorNombre(catalogo, "tobo"));

// filtrar por rango de precio
const filtrarJuegosPorPrecio = (juegos: Juego[], min: number, max: number): Juego[] =>
  juegos.filter(j => j.precio >= min && j.precio <= max);
console.log(filtrarJuegosPorPrecio(catalogo, 50000, 95000));

// reservas de ejemplo, para probar las consultas de abajo
const reservas: Reserva[] = [
  { id: "r1", codigo: "JY-AAAA", cliente: "Angel", telefono: "+56911111111", juegoId: "castillo", fecha: "2026-10-20", horas: 6, total: 90000, estado: "confirmada" },
  { id: "r2", codigo: "JY-BBBB", cliente: "Camila", telefono: "+56922222222", juegoId: "hockey", fecha: "2026-10-22", horas: 3, total: 36000, estado: "pendiente" },
  { id: "r3", codigo: "JY-CCCC", cliente: "Angel", telefono: "+56911111111", juegoId: "arcade", fecha: "2026-11-01", horas: 6, total: 54000, estado: "completada" }
];

function obtenerReservasPorEstado(reservas: Reserva[], estado?: EstadoReserva): Reserva[] {
  return estado ? reservas.filter(r => r.estado === estado) : reservas;
}
console.log(obtenerReservasPorEstado(reservas, "pendiente"));

// revisa si ya hay una reserva activa para el mismo juego el mismo día (pa' no chocar reservas)
function hayChoqueDisponibilidad(reservas: Reserva[], juegoId: string, fecha: string): boolean {
  return reservas.some(r => r.juegoId === juegoId && r.fecha === fecha && (r.estado === "pendiente" || r.estado === "confirmada"));
}
console.log(hayChoqueDisponibilidad(reservas, "castillo", "2026-10-20"));

// suma lo ganado entre dos fechas, solo reservas confirmadas o completadas
function calcularIngresosPorPeriodo(reservas: Reserva[], desde: string, hasta: string): number {
  return reservas
    .filter(r => (r.estado === "confirmada" || r.estado === "completada") && r.fecha >= desde && r.fecha <= hasta)
    .reduce((total, r) => total + r.total, 0);
}
console.log(`Ingresos de octubre: ${calcularIngresosPorPeriodo(reservas, "2026-10-01", "2026-10-31")}`);

// mismo cálculo pero recorriendo a mano, para comparar los distintos for
console.log("Leyendo reservas con For");
for (let i = 0; i < reservas.length; i++) {
  console.log(reservas[i].codigo);
}

console.log("Leyendo reservas con For Of");
for (const r of reservas) {
  console.log(r.cliente, r.total);
}

console.log("Leyendo reservas con For Each");
reservas.forEach(r => {
  console.log(`${r.codigo}: ${r.estado}`);
});
