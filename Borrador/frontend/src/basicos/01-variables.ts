// variables básicas: let se puede reasignar, const no (acá uso datos de un juego del catálogo)
let nombreJuego: string = "Castillo Inflable";
const categoriaJuego: string = "Inflable";

console.log({ nombreJuego }, { categoriaJuego });
console.log(nombreJuego.endsWith("e"));

const esInflable = categoriaJuego.includes("Inflable");
console.log({ esInflable });

// esto sí se puede, nombreJuego es let
nombreJuego = "Tobogán Jungla";
console.log({ nombreJuego });
