// desestructurar arreglos: sacar elementos de una lista por posición
import { catalogo } from "./04-arreglos.ts";

const nombresCatalogo = catalogo.map(j => j.nombre);
console.log(nombresCatalogo);

const [primero, segundo, tercero] = nombresCatalogo;
console.log(primero, segundo, tercero);

// con comas vacías salto los que no me interesan y me quedo solo con el último
const [, , , , quinto] = nombresCatalogo;
console.log(quinto);
