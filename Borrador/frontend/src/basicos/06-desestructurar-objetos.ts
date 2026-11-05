// desestructurar objetos: sacar campos de un Juego/Reserva sin ir escribiendo juego.nombre, juego.precio, etc.
import type { Juego } from "./03-interfaces.ts";
import { catalogo } from "./04-arreglos.ts";

const juego = catalogo[0];

// "a mano"
const nombre = juego.nombre;
const precio = juego.precio;
console.log({ nombre }, { precio });

// desestructurando directo
const { id, categoria, activo } = juego;
console.log({ id }, { categoria }, { activo });

// desestructurando un parámetro de función (como useContext en el ejemplo del curso)
const armarResumen = ({ nombre, categoria, precio }: Juego) => {
  return {
    titulo: `${nombre} (${categoria})`,
    precioJornada: precio,
    precioHora: Math.round(precio / 6)
  };
};

const resumen = armarResumen(juego);
console.log(resumen);
console.log(resumen.titulo);
