// ===================================================================
// app.ts: el sitio del cliente (catálogo, carrito, registro, login, detalle de compra).
// Lo carga cada página con  <script type="module" src="/src/app.ts"></script>  y Vite lo compila solo
// (npm run dev). Se comunica con los microservicios a través de ./api.
// ===================================================================

import { apiCatalogo, apiPagos, apiPedidos, apiUsuarios } from "./api";
import type { ApiCategoria, ApiJuego, ApiLogin, ApiPedido } from "./api";

// bootstrap viene del <script> del CDN (bootstrap.bundle.min.js), no es un módulo, por eso lo declaro así
declare const bootstrap: {
  Toast: { getOrCreateInstance(el: Element | null): { show(): void } };
};

// ===================================================================
// Tipos: el "molde" de cada dato que se mueve por el sitio (hu-08 a hu-11, hu-17, hu-50 y los que guarda admin.html)
// ===================================================================

type Categoria = "Inflable" | "Acuático" | "Interior";

// una reseña de cliente, tal cual la guarda DETALLE_EXTRA y resenasJuegos
interface Resena {
  autor: string;
  estrellas: number;
  comentario: string;
}

// lo "extra" que no guarda el admin (foto, calificación, dimensiones, reseñas)
interface DetalleExtra {
  imagen: string;
  alt: string;
  rating: string;
  meta: [string, string][];
  resenas: Resena[];
}

// un juego tal cual lo guarda admin.html en localStorage (o los de fábrica si no hay admin todavía)
interface JuegoAdmin {
  id: string;
  nombre: string;
  categoria: Categoria;
  precio: number;
  descripcion: string;
  activo: boolean;
}

// un juego ya listo para mostrar en el catálogo: lo del admin + lo extra (foto, reseñas, etc)
interface JuegoPublicado extends JuegoAdmin, DetalleExtra {}

interface Descuento {
  codigo: string;
  tipo: "porcentaje" | "fijo";
  valor: number;
  activo: boolean;
}

// esto es un resumen de lo que guarda admin.html; acá al catálogo del cliente solo le
// interesan los juegos (y los descuentos, si algún día los uso). "reservas" también vive
// en este mismo objeto -ahora admin.ts la tipa en serio- pero el catálogo no la necesita,
// así que la dejo como "unknown[]" nomás para no duplicar ese tipo acá.
interface DatosAdmin {
  juegos: JuegoAdmin[];
  reservas?: unknown[];
  descuentos?: Descuento[];
}

// un código de descuento ya "traducido" a algo listo para usar en el carrito
interface CodigoDescuentoResuelto {
  tipo: "porcentaje" | "fijo";
  valor: number; // si es porcentaje, ya viene como 0.10 (no como 10)
  etiqueta: string;
}

// un juego agregado al carrito del cliente
interface ItemCarrito {
  id: string;
  nombre: string;
  horas: number;
  precioHora: number;
  precio: number;
}

// la sesión activa del cliente, guardada bajo CLAVE_SESION
interface SesionCliente {
  nombre: string;
  email: string;
  token?: string; // token que devuelve el microservicio Usuarios al iniciar sesión
  usuarioId?: number;
  rol?: string;
}

// ===================================================================

// acá guardo los juegos que el usuario va agregando a su reserva, parte vacío obvio (hu-23)
const carrito: ItemCarrito[] = [];
// esto es pa' no andar escribiendo "$" y los puntos a mano, js ya trae algo que formatea plata chilena
const formatoCLP = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" });

// el toast es el cartelito que aparece abajo a la derecha avisando cosas, lo dejo listo acá arriba
// porque lo uso desde varias partes del código (catálogo, login, registro, etc)
const elementoToast = document.querySelector("#appToast");
const toast = elementoToast ? bootstrap.Toast.getOrCreateInstance(elementoToast) : null;

// misma clave que usa admin.html para guardar sus datos en este navegador, así leemos lo mismo que carga el admin
const CLAVE_ADMIN = "juegaya-admin-v1";

// función pa' mostrar el toast, le paso el mensaje y listo.
// OJO: en el app.js original esta función vivía adentro de inicializarCatalogo(), por lo que
// crear-cuenta.html e iniciar-sesion.html (páginas sin catálogo) en realidad explotaban con
// "mostrarToast is not defined" al enviar el formulario. TypeScript lo marca como error de
// compilación (no encuentra el nombre), así que la subí acá arriba para que la vean TODAS las páginas.
function mostrarToast(mensaje: string): void {
  const textoToast = document.querySelector("#toastMensaje");
  if (!toast || !textoToast) { console.warn(mensaje); return; }
  textoToast.textContent = mensaje;
  toast.show();
}

// trae lo que haya guardado el admin (juegos y descuentos), o null si todavía no se ha abierto nunca el admin.html
function obtenerDatosAdmin(): DatosAdmin | null {
  try {
    const guardado = localStorage.getItem(CLAVE_ADMIN);
    if (!guardado) return null;
    const datos = JSON.parse(guardado);
    if (datos && Array.isArray(datos.juegos)) return datos as DatosAdmin;
  } catch (e) { /* si viene corrupto, sigo con los datos de siempre */ }
  return null;
}

// ===================================================================
// Juegos: vienen del microservicio Catalogo (puerto 8081). Ya no hay datos guardados en el navegador.
// ===================================================================
const CATEGORIA_DESDE_API: Record<ApiCategoria, Categoria> = { INFLABLE: "Inflable", ACUATICO: "Acuático", INTERIOR: "Interior" };

// reseñas de cada juego por id; se llena cada vez que se pinta el catálogo
const resenasJuegos: Record<string, Resena[]> = {};

// convierte un juego como lo entrega la API en el formato que usan las tarjetas y la ficha
function apiAJuegoPublicado(j: ApiJuego): JuegoPublicado {
  const resenas: Resena[] = (j.resenas || []).map(r => ({ autor: r.autor, estrellas: r.estrellas, comentario: r.comentario || "" }));
  const promedio = resenas.length ? resenas.reduce((suma, r) => suma + r.estrellas, 0) / resenas.length : 0;
  return {
    id: j.id,
    nombre: j.nombre,
    categoria: CATEGORIA_DESDE_API[j.categoria] || "Interior",
    precio: j.precioJornada,
    descripcion: j.descripcion || "",
    activo: j.activo,
    imagen: j.imagenUrl || "",
    alt: j.nombre,
    rating: resenas.length ? promedio.toFixed(1).replace(".", ",") : "Nuevo",
    meta: j.capacidad ? [["bi-people", j.capacidad]] : [],
    resenas
  };
}

// trae del Catalogo los juegos activos (la API ya filtra los inactivos)
async function obtenerJuegosPublicados(): Promise<JuegoPublicado[]> {
  const juegos = await apiCatalogo.listar();
  return juegos.map(apiAJuegoPublicado);
}

// para no meter caracteres raros de html si un nombre o comentario trae < > " '
function esc(texto: unknown): string {
  const mapa: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(texto ?? "").replace(/[&<>"']/g, c => mapa[c]);
}

// esta función llena la página detalle-producto.html con la info del juego que venga en la URL (?id=castillo, por ejemplo)
async function inicializarDetalleProducto(): Promise<void> {
  const ficha = document.querySelector("#dpFicha");
  if (!ficha) return; // si no estamos en detalle-producto.html, ni sigo

  const HORAS_JORNADA_DETALLE = 6; // esta página no depende de inicializarCatalogo(), así que la dejo propia acá

  // saco el "id" que viene pegado en la URL, tipo detalle-producto.html?id=castillo
  const idBuscado = new URLSearchParams(window.location.search).get("id");
  let producto: JuegoPublicado | undefined;
  try {
    producto = idBuscado ? apiAJuegoPublicado(await apiCatalogo.obtener(idBuscado)) : undefined;
    if (producto && !producto.activo) producto = undefined; // un juego dado de baja no se muestra al público
  } catch (e) {
    console.error(e);
    producto = undefined;
  }

  if (!producto) {
    // si no existe ese id, muestro el mensaje de "no encontrado" y no sigo
    document.querySelector("#dpNoEncontrado")!.classList.remove("d-none");
    return;
  }

  const precioHora = Math.round(producto.precio / HORAS_JORNADA_DETALLE);
  const formatoCLP = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" });

  document.title = `${producto.nombre} | JuegaYa`;
  document.querySelector("#dpCategoria")!.textContent = producto.categoria.toUpperCase();
  document.querySelector("#dpNombre")!.textContent = producto.nombre;
  document.querySelector("#dpRating")!.textContent = producto.rating;
  document.querySelector("#dpDescripcion")!.textContent = producto.descripcion;
  document.querySelector("#dpMetaLista")!.innerHTML = producto.meta.map(([icono, texto]) => `<span><i class="bi ${icono}"></i> ${esc(texto)}</span>`).join("");
  document.querySelector("#dpPrecioJornada")!.textContent = formatoCLP.format(producto.precio);
  document.querySelector("#dpPrecioHora")!.textContent = `${formatoCLP.format(precioHora)} / hora`;
  (document.querySelector("#dpReservarLink") as HTMLAnchorElement).href = `catalogo.html#juego-${encodeURIComponent(idBuscado ?? "")}`;

  // si tiene foto la muestro, si no (como el arcade), pongo el fondo con ícono en vez de una imagen rota
  if (producto.imagen) {
    const img = document.querySelector("#dpImagen") as HTMLImageElement;
    img.src = producto.imagen;
    img.alt = producto.alt || producto.nombre;
  } else {
    const wrap = document.querySelector("#dpImagenWrap")!;
    wrap.classList.add("arcade-visual");
    wrap.innerHTML = `<i class="bi bi-joystick" style="font-size:4rem"></i><span>${esc(producto.categoria.toUpperCase())}</span>`;
  }

  // reseñas completas del producto (o un mensajito si todavía no tiene ninguna)
  document.querySelector("#dpCantidadResenas")!.textContent = producto.resenas.length
    ? `(${producto.resenas.length} reseña${producto.resenas.length === 1 ? "" : "s"})`
    : "(sin reseñas todavía)";
  document.querySelector("#dpResenas")!.innerHTML = producto.resenas.length
    ? producto.resenas.map(r => `
      <div class="cart-item">
        <div>
          <strong>${esc(r.autor)}</strong>
          <small class="d-block text-secondary">${"★".repeat(r.estrellas)}${"☆".repeat(5 - r.estrellas)}</small>
          <p class="text-secondary mb-0 mt-1">${esc(r.comentario)}</p>
        </div>
      </div>`).join("")
    : `<p class="text-secondary">Este juego todavía no tiene reseñas de clientes.</p>`;

  document.querySelector("#dpFicha")!.classList.remove("d-none");
  document.querySelector("#dpSeccionResenas")!.classList.remove("d-none");
}

// pasa la categoría del admin ("Inflable") al mismo "slug" que usan los botones de filtro del catálogo ("inflables")
const CATEGORIA_SLUG: Record<Categoria, string> = { "Inflable": "inflables", "Acuático": "acuaticos", "Interior": "interior" };

// arma el html de una tarjeta de juego completa, para pintar el catálogo dinámicamente (hu-08, hu-09, hu-10, hu-11)
function tarjetaJuegoHTML(juego: JuegoPublicado): string {
  const slug = CATEGORIA_SLUG[juego.categoria] || "interior";
  const esFoto = !!juego.imagen;
  const bloqueImagen = esFoto
    ? `<img src="${juego.imagen}" class="game-image" alt="${esc(juego.alt || juego.nombre)}">`
    : `<i class="bi bi-joystick"></i><span>${esc(juego.categoria.toUpperCase())}</span>`;

  return `
    <div class="col-md-6 col-xl-4 game-item" id="juego-${esc(juego.id)}" data-category="${slug}">
      <article class="game-card h-100">
        <div class="game-image-wrap${esFoto ? "" : " arcade-visual"}"${esFoto ? "" : ` role="img" aria-label="${esc(juego.nombre)}"`}>
          ${esFoto ? `<a href="detalle-producto.html?id=${encodeURIComponent(juego.id)}" aria-label="Ver detalle de ${esc(juego.nombre)}">${bloqueImagen}</a>` : `<a href="detalle-producto.html?id=${encodeURIComponent(juego.id)}" class="text-reset text-decoration-none" aria-label="Ver detalle de ${esc(juego.nombre)}">${bloqueImagen}</a>`}
          <span class="status-badge"><i class="bi bi-check-circle-fill"></i> Disponible</span>
          <button class="favorite-btn" aria-label="Agregar ${esc(juego.nombre)} a favoritos"><i class="bi bi-heart"></i></button>
        </div>
        <div class="p-4">
          <div class="d-flex justify-content-between align-items-start gap-2">
            <div><span class="game-type">${esc(juego.categoria.toUpperCase())}</span><h3 class="h4 mt-1 mb-2"><a href="detalle-producto.html?id=${encodeURIComponent(juego.id)}" class="text-reset text-decoration-none">${esc(juego.nombre)}</a></h3></div>
            <span class="rating"><i class="bi bi-star-fill"></i> ${juego.rating}</span>
          </div>
          <p class="text-secondary">${esc(juego.descripcion)}</p>
          <div class="game-meta">${juego.meta.map(([icono, texto]) => `<span><i class="bi ${icono}"></i> ${esc(texto)}</span>`).join("")}</div>
          <hr>
          <div class="d-flex justify-content-between align-items-center">
            <div><span class="price">${formatoCLP.format(juego.precio)}</span><small class="text-secondary d-block">por jornada</small></div>
            <button class="btn btn-outline-dark rounded-pill add-btn" data-id="${esc(juego.id)}" data-name="${esc(juego.nombre)}" data-price="${juego.precio}">Agregar</button>
          </div>
        </div>
      </article>
    </div>`;
}

// pinta el catálogo completo dentro de #listaJuegos, usando lo que haya guardado el admin (o los juegos de siempre)
async function pintarCatalogo(): Promise<void> {
  const contenedor = document.querySelector("#listaJuegos");
  if (!contenedor) return;
  let juegos: JuegoPublicado[];
  try {
    juegos = await obtenerJuegosPublicados();
  } catch (e) {
    contenedor.innerHTML = `<div class="empty-state"><i class="bi bi-wifi-off"></i><h3>No se pudo cargar el catálogo</h3><p>${esc((e as Error).message)}</p></div>`;
    return;
  }
  juegos.forEach(j => { resenasJuegos[j.id] = j.resenas; });
  contenedor.innerHTML = juegos.length
    ? juegos.map(tarjetaJuegoHTML).join("")
    : `<div class="empty-state"><i class="bi bi-emoji-frown"></i><h3>Por ahora no hay juegos publicados</h3><p>Vuelve más tarde.</p></div>`;
}

// esta función junta TODO lo del catálogo y el carrito
// ojo: solo se ejecuta si estamos parados en catalogo.html, si no, ni se llama (más abajo se ve eso)
async function inicializarCatalogo(): Promise<void> {
  // lo primero de todo: pinto las tarjetas con los juegos que vienen del admin (o los de siempre) (hu-08, hu-09, hu-10, hu-11)
  await pintarCatalogo();

  // acá agarro los elementos del carrito que voy a necesitar varias veces, para no repetir el querySelector siempre
  const contador = document.querySelector("#contadorCarrito")!;
  const contenedorItems = document.querySelector("#itemsCarrito")!;
  const subtotal = document.querySelector("#subtotalCarrito")!;
  const confirmar = document.querySelector("#confirmarReserva") as HTMLButtonElement;

  // cuántas horas máximo y mínimo se puede arrendar un juego (una jornada completa son 6 horas)
  const HORAS_JORNADA = 6;
  const HORAS_MIN = 1;

  // tarifa de transporte inventada según la comuna, para que el cliente sepa que hay un costo extra (hu-22)
  const tarifasTransporte: Record<string, number> = {
    Concepcion: 5000, Talcahuano: 4000, "Hualpen": 4500, "Chiguayante": 6000, "San Pedro De la Paz": 6000, "Penco": 7000
  };

  // trae los códigos de descuento activos que haya creado el admin, o los 2 de siempre si no hay admin todavía (hu-50, hu-51)
  function obtenerCodigosDescuento(): Record<string, CodigoDescuentoResuelto> {
    const admin = obtenerDatosAdmin();
    const lista: Descuento[] = admin && Array.isArray(admin.descuentos) ? admin.descuentos.filter(d => d.activo) : [
      { codigo: "JUEGA10", tipo: "porcentaje", valor: 10, activo: true },
      { codigo: "VERANO5000", tipo: "fijo", valor: 5000, activo: true }
    ];
    const mapa: Record<string, CodigoDescuentoResuelto> = {};
    lista.forEach(d => {
      // en el admin el porcentaje se guarda como "10" (10%), y acá lo necesito como "0.10" para multiplicar
      const valor = d.tipo === "porcentaje" ? d.valor / 100 : d.valor;
      const etiqueta = d.tipo === "porcentaje" ? `${d.valor}% de descuento` : `${formatoCLP.format(d.valor)} de descuento`;
      mapa[d.codigo] = { tipo: d.tipo, valor, etiqueta };
    });
    return mapa;
  }

  // estas dos variables van cambiando mientras el usuario usa la página (por eso son let y no const)
  let comunaSeleccionada = "";
  let fechaSeleccionada = ""; // la fecha del evento que eligió al buscar disponibilidad (se manda al crear el pedido)
  let descuentoActivo: CodigoDescuentoResuelto | null = null;

  // esta función le agrega a cada tarjeta del catálogo el precio por hora y un inputcito para elegir las horas,
  // todo esto lo armo desde js (no está en el html) para no tener que repetir el mismo bloque 5 veces en el html (hu-20, hu-21)
  function inicializarSelectorHoras(): void {
    document.querySelectorAll<HTMLElement>(".game-card").forEach(card => {
      const boton = card.querySelector<HTMLButtonElement>(".add-btn");
      if (!boton) return; // por si acaso no hay botón, para que no explote

      const id = boton.dataset.id!;
      const precioJornada = Number(boton.dataset.price);
      // saco el precio por hora dividiendo el precio del día en las 6 horas de la jornada
      const precioHora = Math.round(precioJornada / HORAS_JORNADA);
      boton.dataset.priceHora = String(precioHora); // lo dejo guardado ahí mismo en el botón para usarlo después

      // acá meto el textito de "$X / hora" debajo del precio normal
      const bloquePrecio = boton.closest(".d-flex")!.querySelector(".price")!.parentElement!;
      const precioHoraEl = document.createElement("small");
      precioHoraEl.className = "d-block text-secondary price-hora";
      precioHoraEl.textContent = `${formatoCLP.format(precioHora)} / hora`;
      bloquePrecio.appendChild(precioHoraEl);

      // ahora armo el inputcito de horas + el texto que muestra el total, todo metido en un div
      const wrapper = document.createElement("div");
      wrapper.className = "d-flex align-items-center gap-2 hours-selector";

      const label = document.createElement("label");
      label.className = "visually-hidden"; // esto es solo para lectores de pantalla, no se ve en la página
      label.setAttribute("for", `horas-${id}`);
      label.textContent = `Horas para ${boton.dataset.name}`;

      const input = document.createElement("input");
      input.type = "number";
      input.className = "form-control form-control-sm hours-input";
      input.style.width = "4.2rem";
      input.id = `horas-${id}`;
      input.min = String(HORAS_MIN);
      input.max = String(HORAS_JORNADA);
      input.value = String(HORAS_JORNADA); // parte marcando la jornada completa por defecto
      input.setAttribute("aria-label", `Horas para ${boton.dataset.name}`);
      input.dataset.id = id;

      const totalEl = document.createElement("small");
      totalEl.className = "text-secondary total-preview";
      totalEl.dataset.id = id;
      totalEl.textContent = `Total: ${formatoCLP.format(precioHora * HORAS_JORNADA)}`;

      // esta función actualiza el "Total:" mientras el usuario va escribiendo, sin pisarle lo que está tipeando
      // (antes tenía un bug feo: si escribías "4" quedando "14" por un segundo, lo dejaba en 6 sí o sí)
      const actualizarPreview = () => {
        const valorCrudo = Number(input.value);
        const horasPreview = !valorCrudo || valorCrudo < HORAS_MIN
          ? HORAS_MIN
          : Math.min(valorCrudo, HORAS_JORNADA);
        totalEl.textContent = `Total: ${formatoCLP.format(precioHora * horasPreview)}`;
      };

      // esto solo corrige el valor del input cuando el usuario ya terminó de escribir (sale del campo)
      const normalizarValor = () => {
        let horas = Number(input.value);
        if (!horas || horas < HORAS_MIN) horas = HORAS_MIN;
        if (horas > HORAS_JORNADA) horas = HORAS_JORNADA;
        input.value = String(horas);
        actualizarPreview();
      };

      input.addEventListener("input", actualizarPreview); // cada tecla que aprieta
      input.addEventListener("change", normalizarValor); // cuando saca el foco del input

      wrapper.append(label, input, totalEl);
      boton.insertAdjacentElement("beforebegin", wrapper); // lo pongo justo antes del botón "Agregar"
    });
  }

  // esta función le agrega al carrito lateral las filas de transporte, descuento, total y el campo
  // para meter el código de descuento. todo esto tampoco está en el html, lo armo acá (hu-22, hu-50)
  function inicializarCarritoExtras(): void {
    const cartTotal = document.querySelector(".cart-total")!;
    const notaOriginal = cartTotal.querySelector("small.text-secondary")!; // esta es la notita que venía por defecto en el html

    const filaTransporte = document.createElement("div");
    filaTransporte.className = "d-flex justify-content-between mb-1";
    filaTransporte.innerHTML = `<span>Transporte <small class="text-secondary" id="comunaTransporte"></small></span><strong id="valorTransporte">$0</strong>`;

    const filaDescuento = document.createElement("div");
    filaDescuento.className = "d-flex justify-content-between mb-1 d-none"; // parte oculta hasta que apliquen un código
    filaDescuento.id = "filaDescuento";
    filaDescuento.innerHTML = `<span>Descuento</span><strong id="valorDescuento" class="text-success">-$0</strong>`;

    const filaTotal = document.createElement("div");
    filaTotal.className = "d-flex justify-content-between fw-bold border-top pt-2 mt-1";
    filaTotal.innerHTML = `<span>Total</span><strong id="totalFinal">$0</strong>`;

    const codigoWrap = document.createElement("div");
    codigoWrap.className = "d-flex gap-2 mt-3";
    codigoWrap.innerHTML = `
      <input type="text" class="form-control form-control-sm" id="codigoDescuento" placeholder="Código de descuento">
      <button type="button" class="btn btn-outline-dark btn-sm" id="aplicarCodigo">Aplicar</button>`;

    const codigosActivos = Object.keys(obtenerCodigosDescuento());
    const promoBanner = document.createElement("p");
    promoBanner.className = "small text-secondary mb-0 mt-2";
    promoBanner.id = "promoBanner";
    promoBanner.innerHTML = codigosActivos.length
      ? `<i class="bi bi-tag"></i> Código disponible: <strong>${esc(codigosActivos[0])}</strong>`
      : "";

    // voy insertando todo esto justo antes de la notita original, y al final la reemplazo por el input de código + el banner
    cartTotal.insertBefore(filaTransporte, notaOriginal);
    cartTotal.insertBefore(filaDescuento, notaOriginal);
    cartTotal.insertBefore(filaTotal, notaOriginal);
    notaOriginal.replaceWith(codigoWrap, promoBanner);

    // cuando el usuario aprieta "Aplicar", reviso si el código existe en mi lista de arriba
    document.querySelector("#aplicarCodigo")!.addEventListener("click", () => {
      const codigo = (document.querySelector("#codigoDescuento") as HTMLInputElement).value.trim().toUpperCase();
      const codigosDescuento = obtenerCodigosDescuento();
      if (codigosDescuento[codigo]) {
        descuentoActivo = codigosDescuento[codigo];
        mostrarToast(`Código aplicado: ${descuentoActivo.etiqueta}`);
        renderCarrito(); // vuelvo a pintar el carrito para que se vea el descuento aplicado
      } else {
        mostrarToast("Código de descuento inválido");
      }
    });
  }

  // esta es LA función que pinta de nuevo todo el carrito cada vez que algo cambia (agregar, quitar, cambiar horas, etc)
  // básicamente borro todo y lo vuelvo a dibujar, más fácil que andar actualizando pedacito por pedacito
  function renderCarrito(): void {
    contador.textContent = String(carrito.length);
    confirmar.disabled = carrito.length === 0; // si el carrito está vacío, no lo dejo confirmar

    const subtotalValor = carrito.reduce((total, item) => total + item.precio, 0);
    subtotal.textContent = formatoCLP.format(subtotalValor);

    // calculo la tarifa de transporte según la comuna que eligió el usuario al buscar disponibilidad (hu-22)
    const tarifa = comunaSeleccionada ? (tarifasTransporte[comunaSeleccionada] || 0) : 0;
    document.querySelector("#comunaTransporte")!.textContent = comunaSeleccionada ? `(${comunaSeleccionada})` : "(elige tu comuna)";
    document.querySelector("#valorTransporte")!.textContent = formatoCLP.format(tarifa);

    // si hay un código de descuento aplicado, calculo cuánto hay que restar (hu-50)
    let descuentoValor = 0;
    const filaDescuento = document.querySelector("#filaDescuento")!;
    if (descuentoActivo && carrito.length > 0) {
      descuentoValor = descuentoActivo.tipo === "porcentaje" ? Math.round(subtotalValor * descuentoActivo.valor) : descuentoActivo.valor;
      document.querySelector("#valorDescuento")!.textContent = `-${formatoCLP.format(descuentoValor)}`;
      filaDescuento.classList.remove("d-none");
    } else {
      filaDescuento.classList.add("d-none");
    }

    // el total final es: subtotal + transporte - descuento (y nunca menos que $0, obvio)
    document.querySelector("#totalFinal")!.textContent = formatoCLP.format(Math.max(subtotalValor + tarifa - descuentoValor, 0));

    // si no hay nada en el carrito, muestro el mensajito de "carrito vacío" y corto aquí
    if (carrito.length === 0) {
      contenedorItems.innerHTML = `<div class="cart-empty text-center py-5"><i class="bi bi-bag"></i><h3 class="h5 mt-3">Tu reserva está vacía</h3><p class="text-secondary">Agrega un juego desde el catálogo.</p></div>`;
      return;
    }

    // acá dibujo cada juego que está en el carrito, con un input para poder cambiarle las horas después de agregado (hu-24)
    contenedorItems.innerHTML = carrito.map(item => `
      <div class="cart-item">
        <div>
          <strong>${esc(item.nombre)}</strong>
          <div class="d-flex align-items-center gap-2 mt-1">
            <label class="visually-hidden" for="cart-horas-${item.id}">Horas de ${esc(item.nombre)}</label>
            <input type="number" class="form-control form-control-sm cart-hours-input" id="cart-horas-${item.id}" data-id="${item.id}" min="${HORAS_MIN}" max="${HORAS_JORNADA}" value="${item.horas}" style="width:4rem">
            <small class="text-secondary">hora${item.horas === 1 ? "" : "s"}</small>
          </div>
        </div>
        <div class="text-end"><strong>${formatoCLP.format(item.precio)}</strong><button class="remove-item d-block ms-auto" data-remove="${item.id}" aria-label="Quitar ${esc(item.nombre)}"><i class="bi bi-trash3"></i></button></div>
      </div>`).join("");
  }

  // cuando el usuario aprieta "Agregar" en cualquier juego del catálogo, esto lo mete al carrito (hu-23)
  document.querySelectorAll<HTMLButtonElement>(".add-btn").forEach(boton => {
    boton.addEventListener("click", () => {
      // no dejo agregar el mismo juego dos veces (una reserva = un juego físico, no puede estar dos veces a la vez)
      if (carrito.some(item => item.id === boton.dataset.id)) {
        mostrarToast("Este juego ya está en tu reserva");
        return;
      }
      if (boton.disabled) return; // si está marcado como no disponible, ni lo dejo agregar

      // saco las horas que eligió en el inputcito de la tarjeta (y las dejo entre el mínimo y el máximo por si las moscas)
      const horasInput = document.querySelector<HTMLInputElement>(`.hours-input[data-id="${boton.dataset.id}"]`);
      let horas = horasInput ? Number(horasInput.value) : HORAS_JORNADA;
      if (!horas || horas < HORAS_MIN) horas = HORAS_MIN;
      if (horas > HORAS_JORNADA) horas = HORAS_JORNADA;
      const precioHora = Number(boton.dataset.priceHora);

      carrito.push({
        id: boton.dataset.id!,
        nombre: boton.dataset.name!,
        horas,
        precioHora,
        precio: precioHora * horas
      });
      renderCarrito(); // repinto el carrito pa' que se vea el nuevo juego agregado
      mostrarToast(`${boton.dataset.name} agregado a la reserva (${horas} h)`);
    });
  });

  // cuando aprietan el tacho de basura de un item del carrito, lo elimino (hu-25)
  // uso delegación de eventos (escucho en el contenedor completo) porque los botones se crean dinámicamente
  contenedorItems.addEventListener("click", evento => {
    const boton = (evento.target as HTMLElement).closest<HTMLElement>("[data-remove]");
    if (!boton) return; // si el click no fue en un botón de eliminar, no hago nada
    const indice = carrito.findIndex(item => item.id === boton.dataset.remove);
    carrito.splice(indice, 1);
    renderCarrito();
  });

  // esto escucha cuando cambian el número de horas de un juego que YA está en el carrito (hu-24)
  contenedorItems.addEventListener("change", evento => {
    const input = (evento.target as HTMLElement).closest<HTMLInputElement>(".cart-hours-input");
    if (!input) return;
    let horas = Number(input.value);
    if (!horas || horas < HORAS_MIN) horas = HORAS_MIN;
    if (horas > HORAS_JORNADA) horas = HORAS_JORNADA;

    const item = carrito.find(i => i.id === input.dataset.id);
    if (item) {
      item.horas = horas;
      item.precio = item.precioHora * horas; // recalculo el precio de ese item con las horas nuevas
      renderCarrito();
      mostrarToast(`${esc(item.nombre)} actualizado a ${horas} hora${horas === 1 ? "" : "s"}`);
    }
  });

  // esta función mete el buscador y el filtro de precio arriba del catálogo (no vienen en el html, los creo acá) (hu-12, hu-13, hu-14)
  function inicializarBusquedaYPrecio(): void {
    const pills = document.querySelector(".filter-pills");
    if (!pills) return; // por si la página no tiene esa sección

    const buscador = document.createElement("input");
    buscador.type = "search";
    buscador.id = "buscarJuego";
    buscador.className = "form-control form-control-lg";
    buscador.style.maxWidth = "16rem";
    buscador.placeholder = "Buscar juego...";
    buscador.setAttribute("aria-label", "Buscar juego por palabra clave");

    const rangoPrecio = document.createElement("select");
    rangoPrecio.id = "filtroPrecio";
    rangoPrecio.className = "form-select form-select-lg";
    rangoPrecio.style.maxWidth = "12rem";
    rangoPrecio.setAttribute("aria-label", "Filtrar por rango de precio");
    rangoPrecio.innerHTML = `
      <option value="todos">Cualquier precio</option>
      <option value="0-50000">Hasta $50.000</option>
      <option value="50000-80000">$50.000 – $80.000</option>
      <option value="80000-999999">Más de $80.000</option>
    `;

    // los agrego justo al lado de los botones de categoría que ya venían en el html
    pills.insertAdjacentElement("afterend", rangoPrecio);
    pills.insertAdjacentElement("afterend", buscador);

    buscador.addEventListener("input", aplicarFiltros);
    rangoPrecio.addEventListener("change", aplicarFiltros);
  }

  // esta junta los 3 filtros (categoría + texto buscado + rango de precio) y decide qué tarjetas mostrar y cuáles esconder
  function aplicarFiltros(): void {
    const filtro = document.querySelector<HTMLElement>(".filter-btn.active")?.dataset.filter || "todos";
    const texto = (document.querySelector<HTMLInputElement>("#buscarJuego")?.value || "").trim().toLowerCase();
    const rango = document.querySelector<HTMLSelectElement>("#filtroPrecio")?.value || "todos";
    const [precioMin, precioMax] = rango === "todos" ? [0, Infinity] : rango.split("-").map(Number);

    let visibles = 0;
    document.querySelectorAll<HTMLElement>(".game-item").forEach(tarjeta => {
      const nombre = tarjeta.querySelector("h3")!.textContent!.toLowerCase();
      const precio = Number(tarjeta.querySelector<HTMLButtonElement>(".add-btn")!.dataset.price);

      // tiene que cumplir las 3 condiciones a la vez para mostrarse
      const coincideCategoria = filtro === "todos" || (tarjeta.dataset.category ?? "").includes(filtro);
      const coincideTexto = texto === "" || nombre.includes(texto);
      const coincidePrecio = precio >= precioMin && precio <= precioMax;
      const coincide = coincideCategoria && coincideTexto && coincidePrecio;

      tarjeta.classList.toggle("d-none", !coincide); // la escondo o la muestro según corresponda
      if (coincide) visibles++;
    });
    document.querySelector("#sinResultados")!.classList.toggle("d-none", visibles > 0); // muestro el mensaje de "no hay resultados" si corresponde
  }

  // cuando aprietan un botón de categoría (Todos, Inflables, etc), lo marco como activo y aplico los filtros de nuevo (hu-13)
  document.querySelectorAll<HTMLButtonElement>(".filter-btn").forEach(boton => {
    boton.addEventListener("click", () => {
      document.querySelector(".filter-btn.active")!.classList.remove("active");
      boton.classList.add("active");
      aplicarFiltros();
    });
  });

  // cuando aprietan el corazoncito, marco/desmarco el juego como favorito
  // y si ese juego tiene descuento activo, aviso con un toast (hu-47)
  document.querySelectorAll<HTMLButtonElement>(".favorite-btn").forEach(boton => {
    boton.addEventListener("click", () => {
      const activando = !boton.classList.contains("active"); // reviso si lo estaban marcando o desmarcando
      boton.classList.toggle("active");
      boton.querySelector("i")!.classList.toggle("bi-heart");
      boton.querySelector("i")!.classList.toggle("bi-heart-fill");

      if (activando) {
        // el admin maneja los descuentos por código, no por juego específico, así que aviso si hay algún código activo
        const codigos = Object.keys(obtenerCodigosDescuento());
        if (codigos.length) {
          mostrarToast(`🎉 Tienes un código de descuento disponible: usa ${codigos[0]} en tu reserva`);
        }
      }
    });
  });

  // esta función agrega el botón "Ver reseñas" a cada tarjeta y arma el paneleto que se abre con los comentarios (hu-41, hu-43)
  function inicializarResenas(): void {
    document.querySelectorAll<HTMLElement>(".game-card").forEach(card => {
      const id = card.querySelector<HTMLButtonElement>(".add-btn")!.dataset.id!;
      const resenas = resenasJuegos[id];
      if (!resenas) return; // si ese juego no tiene reseñas guardadas, no hago nada

      const ratingEl = card.querySelector(".rating")!;
      const verBtn = document.createElement("button");
      verBtn.type = "button";
      verBtn.className = "btn btn-link btn-sm p-0 ms-2 ver-resenas";
      verBtn.textContent = `Ver reseñas (${resenas.length})`;
      ratingEl.insertAdjacentElement("afterend", verBtn);

      // acá armo el bloque con cada reseña, usando estrellitas llenas y vacías según la calificación
      const panel = document.createElement("div");
      panel.className = "resenas-panel d-none mt-2"; // parte oculto hasta que le hagan click al botón
      panel.innerHTML = resenas.map(r => `
        <div class="mb-2 small">
          <strong>${esc(r.autor)}</strong> · ${"★".repeat(r.estrellas)}${"☆".repeat(5 - r.estrellas)}
          <p class="text-secondary mb-0">${esc(r.comentario)}</p>
        </div>`).join("");
      card.querySelector(".game-meta")!.insertAdjacentElement("afterend", panel);

      // al hacer click, muestro/escondo el panel y cambio el texto del botón
      verBtn.addEventListener("click", () => {
        panel.classList.toggle("d-none");
        verBtn.textContent = panel.classList.contains("d-none") ? `Ver reseñas (${resenas.length})` : "Ocultar reseñas";
      });
    });
  }

  // esta revisa, para una fecha dada, qué juegos están disponibles y cuáles no, y actualiza la tarjeta de cada uno (hu-17, hu-18)
  async function actualizarDisponibilidadPorFecha(fechaISO: string): Promise<number> {
    // se le pregunta al microservicio Catalogo qué juegos están libres ese día (los bloqueos viven en su base de datos)
    const libres = new Set((await apiCatalogo.disponibles(fechaISO)).map(j => j.id));
    let disponibles = 0;

    document.querySelectorAll<HTMLElement>(".game-item").forEach(tarjeta => {
      const boton = tarjeta.querySelector<HTMLButtonElement>(".add-btn")!;
      const horasInput = tarjeta.querySelector<HTMLInputElement>(".hours-input");
      const noDisponible = !libres.has(boton.dataset.id!);

      const badge = tarjeta.querySelector(".status-badge")!;
      const icono = badge.querySelector("i")!;

      if (noDisponible) {
        badge.classList.add("bg-danger-subtle");
        icono.className = "bi bi-x-circle-fill";
        badge.lastChild!.textContent = ` No disponible`;
        boton.disabled = true;
        boton.classList.add("disabled");
        if (horasInput) horasInput.disabled = true;
      } else {
        badge.classList.remove("bg-danger-subtle");
        icono.className = "bi bi-check-circle-fill";
        badge.lastChild!.textContent = ` Disponible`;
        boton.disabled = false;
        boton.classList.remove("disabled");
        if (horasInput) horasInput.disabled = false;
        disponibles++;
      }
    });

    return disponibles;
  }

  // esto se dispara cuando el usuario aprieta "Buscar disponibilidad" arriba en el hero, con su fecha y comuna (hu-17, hu-18, hu-19)
  document.querySelector("#buscarDisponibilidad")!.addEventListener("click", async () => {
    const fecha = document.querySelector<HTMLInputElement>("#fechaEvento")!;
    const comuna = document.querySelector<HTMLSelectElement>("#comunaEvento")!;
    if (!fecha.value || !comuna.value) {
      mostrarToast("Selecciona una fecha y una comuna");
      return; // si falta algo, ni sigo
    }
    // convierto la fecha a algo más legible tipo "25 de septiembre de 2026"
    const fechaLegible = new Date(`${fecha.value}T12:00:00`).toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" });
    document.querySelector("#datosEvento")!.innerHTML = `<i class="bi bi-calendar2-check"></i><span>${fechaLegible} · ${comuna.value}</span>`;

    comunaSeleccionada = comuna.value; // guardo la comuna para calcular el transporte más adelante
    fechaSeleccionada = fecha.value;
    let disponibles = 0;
    try {
      disponibles = await actualizarDisponibilidadPorFecha(fecha.value);
    } catch (e) {
      mostrarToast((e as Error).message);
      return;
    }
    document.querySelector("#catalogo")!.scrollIntoView({ behavior: "smooth" }); // hago scroll bonito hasta el catálogo
    renderCarrito(); // repinto el carrito porque puede que ahora sí tenga tarifa de transporte

    // reviso si alguno de los favoritos del usuario justo quedó no disponible esa fecha, para avisarle (hu-19)
    const favoritosNoDisponibles = [...document.querySelectorAll<HTMLElement>(".favorite-btn.active")]
      .map(boton => boton.closest<HTMLElement>(".game-item")!)
      .filter(tarjeta => tarjeta.querySelector<HTMLButtonElement>(".add-btn")!.disabled)
      .map(tarjeta => tarjeta.querySelector("h3")!.textContent);

    if (favoritosNoDisponibles.length > 0) {
      mostrarToast(`⚠️ Tu favorito ${favoritosNoDisponibles.join(", ")} no está disponible esa fecha`);
    } else if (disponibles === 0) {
      mostrarToast("No hay juegos disponibles para esa fecha, prueba con otra");
    } else {
      mostrarToast(`${disponibles} juego(s) disponibles para tu fecha`);
    }
  });

  // cuando aprietan "Solicitar reserva": se crea el pedido de verdad en el microservicio Pedidos
  // (con cada juego del carrito) y se pasa a detalle-compra.html para ingresar la entrega y el pago
  confirmar.addEventListener("click", async () => {
    const sesion = obtenerSesion();
    if (!sesion || !sesion.token || !sesion.usuarioId) {
      mostrarToast("Inicia sesión para solicitar tu reserva");
      setTimeout(() => { window.location.href = "iniciar-sesion.html"; }, 1200);
      return;
    }
    if (!fechaSeleccionada) {
      mostrarToast("Primero elige la fecha y la comuna en \"Buscar disponibilidad\"");
      return;
    }

    const textoOriginal = confirmar.innerHTML;
    confirmar.innerHTML = `<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Enviando...`;
    confirmar.disabled = true;
    try {
      const pedido = await apiPedidos.crear(sesion.usuarioId);
      for (const item of carrito) {
        await apiPedidos.agregarItem(pedido.id, { juegoId: item.id, fechaEvento: fechaSeleccionada, horas: item.horas, precioHora: item.precioHora });
      }
      window.location.href = `detalle-compra.html?pedido=${pedido.id}&comuna=${encodeURIComponent(comunaSeleccionada)}`;
    } catch (e) {
      mostrarToast((e as Error).message);
      confirmar.innerHTML = textoOriginal;
      confirmar.disabled = false;
    }
  });

  // no dejo elegir una fecha que ya pasó (el mínimo del input queda en el día de hoy)
  (document.querySelector("#fechaEvento") as HTMLInputElement).min = new Date().toISOString().split("T")[0];

  // acá dejo todo listo apenas carga la página: le agrego el selector de horas a cada tarjeta,
  // el buscador, las reseñas, los extras del carrito, y pinto el carrito una primera vez (aunque parta vacío)
  inicializarSelectorHoras();
  inicializarBusquedaYPrecio();
  inicializarResenas();
  inicializarCarritoExtras();
  renderCarrito();
} // acá se cierra inicializarCatalogo(), ojo con este corchete jaja

// ===================================================================
// de acá para abajo: registro e inicio de sesión, contra el microservicio Usuarios (puerto 8082).
// En el navegador solo queda la sesión (token) para saber quién está logueado.
// ===================================================================
const CLAVE_SESION = "juegaya_sesion";

// quién está logueado ahora (o null)
function obtenerSesion(): SesionCliente | null {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_SESION) || "null");
  } catch (e) {
    return null;
  }
}

// deja guardada la sesión que devolvió el login
function guardarSesion(login: ApiLogin): void {
  const sesion: SesionCliente = { nombre: login.usuario.nombre, email: login.usuario.email, token: login.token, usuarioId: login.usuario.id, rol: login.usuario.rol };
  localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
}

// formulario "Crear cuenta" (hu-01): registra en Usuarios y deja la sesión iniciada
function inicializarRegistro(): void {
  const form = document.querySelector("#registroForm");
  if (!form) return; // si no estamos en la página de registro, no hago nada

  form.addEventListener("submit", async evento => {
    evento.preventDefault();

    const nombre = (document.querySelector("#nombre") as HTMLInputElement).value.trim();
    const email = (document.querySelector("#email") as HTMLInputElement).value.trim().toLowerCase();
    const password = (document.querySelector("#password") as HTMLInputElement).value;

    if (!nombre || !email || !password) {
      mostrarToast("Completa todos los campos para crear tu cuenta");
      return;
    }
    if (password.length < 6) {
      mostrarToast("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    try {
      await apiUsuarios.registrar(nombre, email, password);
      guardarSesion(await apiUsuarios.login(email, password)); // lo dejo logueado de una
      mostrarToast(`¡Cuenta creada! Bienvenido/a ${nombre}`);
      setTimeout(() => { window.location.href = "catalogo.html"; }, 1200);
    } catch (e) {
      mostrarToast((e as Error).message); // por ejemplo: el correo ya está registrado (409)
    }
  });
}

// formulario "Iniciar sesión" (hu-03): valida contra Usuarios; el admin va al panel
function inicializarLogin(): void {
  const form = document.querySelector("#loginForm");
  if (!form) return;

  form.addEventListener("submit", async evento => {
    evento.preventDefault();

    const email = (document.querySelector("#loginEmail") as HTMLInputElement).value.trim().toLowerCase();
    const password = (document.querySelector("#loginPassword") as HTMLInputElement).value;

    try {
      const login = await apiUsuarios.login(email, password);
      guardarSesion(login);
      mostrarToast(`¡Hola de nuevo, ${login.usuario.nombre}!`);
      const destino = login.usuario.rol === "ADMINISTRADOR" ? "admin.html" : "catalogo.html";
      setTimeout(() => { window.location.href = destino; }, 1000);
    } catch (e) {
      mostrarToast((e as Error).message);
    }
  });
}

// ===================================================================
// detalle-compra.html: muestra el pedido real (microservicio Pedidos), lo confirma con los datos de entrega
// y registra el pago (microservicio Pagos). También bloquea las fechas en el Catalogo.
// ===================================================================
function inicializarDetalleCompra(): void {
  const form = document.querySelector("#entregaForm") as HTMLFormElement | null;
  if (!form) return; // no estamos en detalle-compra.html

  const boton = document.querySelector("#confirmarDetalle") as HTMLButtonElement;
  const listaItems = document.querySelector("#detalleItems")!;
  const sesion = obtenerSesion();
  const pedidoId = Number(new URLSearchParams(window.location.search).get("pedido"));
  const comuna = new URLSearchParams(window.location.search).get("comuna") || "";

  if (!sesion || !sesion.token || !sesion.usuarioId) {
    mostrarToast("Inicia sesión para ver tu reserva");
    setTimeout(() => { window.location.href = "iniciar-sesion.html"; }, 1200);
    return;
  }
  if (!pedidoId) {
    listaItems.innerHTML = `<p class="text-secondary mb-0">No hay una reserva en curso. Arma tu reserva desde el <a href="catalogo.html#catalogo">catálogo</a>.</p>`;
    boton.disabled = true;
    return;
  }

  let pedido: ApiPedido | null = null;

  // carga el pedido y pinta el resumen con datos reales
  async function cargarPedido(): Promise<void> {
    try {
      pedido = await apiPedidos.obtener(pedidoId);
      const nombres: Record<string, string> = {};
      (await apiCatalogo.listar()).forEach(j => { nombres[j.id] = j.nombre; });

      listaItems.innerHTML = pedido.items.map(i => `
        <div class="cart-item">
          <div><strong>${esc(nombres[i.juegoId] || i.juegoId)}</strong><small class="d-block text-secondary">${i.horas} hora${i.horas === 1 ? "" : "s"} · ${esc(i.fechaEvento)}</small></div>
          <div class="text-end"><strong>${formatoCLP.format(i.subtotal)}</strong></div>
        </div>`).join("") || `<p class="text-secondary mb-0">El pedido no tiene juegos.</p>`;
      document.querySelector("#detalleSubtotal")!.textContent = formatoCLP.format(pedido.subtotal);
      document.querySelector("#detalleTotal")!.textContent = formatoCLP.format(pedido.total);
      document.querySelector("#detalleComuna")!.textContent = comuna ? `(${comuna})` : "";
      if (pedido.items.length) (document.querySelector("#fechaEntrega") as HTMLInputElement).value = pedido.items[0].fechaEvento;
      if (pedido.estado !== "BORRADOR") {
        boton.disabled = true;
        boton.textContent = `Reserva ${pedido.codigo || ""} enviada (${pedido.estado})`;
      }
    } catch (e) {
      listaItems.innerHTML = `<p class="text-danger mb-0">${esc((e as Error).message)}</p>`;
      boton.disabled = true;
    }
  }

  boton.addEventListener("click", async () => {
    if (!pedido || !form.reportValidity()) return;
    const campo = (id: string) => (document.querySelector(id) as HTMLInputElement).value.trim();
    const metodo = (document.querySelector("#pagoTarjeta") as HTMLInputElement).checked ? "TARJETA" : "TRANSFERENCIA";
    const direccion = comuna ? `${campo("#direccionEntrega")}, ${comuna}` : campo("#direccionEntrega");

    boton.disabled = true;
    boton.innerHTML = `<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Enviando...`;
    try {
      const confirmado = await apiPedidos.confirmar(pedidoId, { nombre: campo("#nombreEntrega"), telefono: campo("#telefonoEntrega"), direccion, indicaciones: campo("#indicacionesEntrega") });
      const pago = await apiPagos.iniciar(pedidoId, sesion.usuarioId!, confirmado.total, metodo);
      // se bloquea cada fecha en el Catalogo para que el juego deje de aparecer disponible ese día
      for (const item of confirmado.items) {
        await apiCatalogo.bloquear(item.juegoId, item.fechaEvento, pedidoId);
      }
      boton.innerHTML = `<i class="bi bi-check2 me-2"></i>Solicitud enviada`;
      mostrarToast(`Reserva ${confirmado.codigo} enviada. Pago #${pago.id} (${metodo.toLowerCase()}) pendiente de confirmación`);
    } catch (e) {
      mostrarToast((e as Error).message);
      boton.disabled = false;
      boton.textContent = "Confirmar reserva";
    }
  });

  cargarPedido();
}

// y acá abajo es donde realmente se "prende" todo el script.
// primero reviso si esta página tiene el catálogo (el #listaJuegos), y si es así, recién ahí corro toda la lógica del carrito.
// esto evita que truene el script en páginas como login o registro, que no tienen esos elementos
if (document.querySelector("#listaJuegos")) inicializarCatalogo();
inicializarRegistro(); // esta función misma revisa si existe el form, así que no pasa nada si la llamo siempre
inicializarLogin(); // lo mismo acá
inicializarDetalleCompra(); // revisa si existe #entregaForm
inicializarDetalleProducto(); // y esta revisa si existe #dpFicha, mismo cuento
