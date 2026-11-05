// arreglos: acá el catálogo de juegos, como una lista normal de objetos tipados
import type { Juego } from "./03-interfaces.ts";

export const catalogo: Juego[] = [
  { id: "castillo", nombre: "Castillo Inflable", categoria: "Inflable", precio: 90000, descripcion: "Castillo clásico.", activo: true },
  { id: "tobogan", nombre: "Tobogán Jungla", categoria: "Inflable", precio: 96000, descripcion: "Tobogán temático selva.", activo: true },
  { id: "arcade", nombre: "Arcade Retro", categoria: "Interior", precio: 54000, descripcion: "Máquinas arcade retro.", activo: true },
  { id: "taca-taca", nombre: "Taca Taca", categoria: "Interior", precio: 48000, descripcion: "Futbolito de mesa.", activo: false },
  { id: "hockey", nombre: "Hockey de Mesa", categoria: "Interior", precio: 72000, descripcion: "Hockey de mesa con luces.", activo: true }
];

console.log(catalogo[2]);

// spread para sacar una copia y no afectar el catálogo original
const copiaCatalogo = [...catalogo];
console.log(catalogo.length, copiaCatalogo.length);

// las horas que se pueden elegir al reservar (1 a 6, una jornada completa)
const horasDisponibles: number[] = [1, 2, 3, 4, 5, 6];
console.log(horasDisponibles[horasDisponibles.length - 1]);

// nombres de los juegos activos, ordenados alfabéticamente
const nombresActivos = catalogo.filter(j => j.activo).map(j => j.nombre).sort();
console.log(nombresActivos);
