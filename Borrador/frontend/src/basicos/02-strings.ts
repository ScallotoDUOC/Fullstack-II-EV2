// template strings y formateo de plata chilena, lo mismo que usa app.js para mostrar precios
const cliente = "Angel";
let juego = "Arcade Retro";

console.log(`${cliente} reservó: ${juego}`);

juego = 'Hockey de Mesa';
console.log(`${cliente} ahora reservó: ${juego}`);

// Intl ya trae el formato de moneda, no hay que andar poniendo "$" y puntos a mano
const formatoCLP = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" });
console.log(formatoCLP.format(54000));

// código de reserva cortito tipo "JY-4F2K", para mostrarle al cliente
const generarCodigoReserva = (): string => `JY-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
console.log(generarCodigoReserva());
