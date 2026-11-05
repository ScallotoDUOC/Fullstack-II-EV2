// acá quedan los "moldes" (interfaces) de los datos que maneja JuegaYa.
// son los mismos campos que guardan admin.html (localStorage "juegaya-admin-v1") y app.js.

export type Categoria = "Inflable" | "Acuático" | "Interior";

export interface Juego {
  id: string;
  nombre: string;
  categoria: Categoria;
  precio: number; // precio por jornada completa (6 horas)
  descripcion: string;
  activo: boolean; // si es false, no se muestra en el catálogo del cliente
}

export type EstadoReserva = "pendiente" | "confirmada" | "completada" | "cancelada";

export interface Reserva {
  id: string;
  codigo: string;
  cliente: string;
  telefono: string;
  juegoId: string;
  fecha: string; // ISO "YYYY-MM-DD"
  horas: number; // entre 1 y 6
  total: number;
  estado: EstadoReserva;
}

export interface Usuario {
  nombre: string;
  email: string;
  password: string;
}

// --- ejemplo armando un objeto con el molde Juego ---
const castillo: Juego = {
  id: "castillo",
  nombre: "Castillo Inflable",
  categoria: "Inflable",
  precio: 90000,
  descripcion: "Castillo inflable clásico para fiestas infantiles.",
  activo: true
};

console.log(castillo);
console.log(castillo.precio);

// toma el tipo de castillo pero no se sobreescribe el original al reasignar
let otroJuego = castillo;
otroJuego = {
  id: "tobogan",
  nombre: "Tobogán Jungla",
  categoria: "Inflable",
  precio: 96000,
  descripcion: "Tobogán temático selva.",
  activo: true
};

// con el spread saco una copia nueva y la modifico sin tocar la original
const copiaCastillo = { ...castillo };
copiaCastillo.precio = 85000;

console.log(castillo);
console.log(otroJuego);
console.log(copiaCastillo);
