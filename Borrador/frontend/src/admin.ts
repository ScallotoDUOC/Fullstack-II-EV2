// ===================================================================
// Esta es la versión TypeScript del panel de admin. Antes todo esto vivía metido
// directo en un <script> dentro de admin.html; ahora se compila junto con app.ts
// (mismo tsconfig, mismo "npm run build") y admin.html solo carga el resultado:
// js/admin.js. O sea: de ahora en adelante los cambios se hacen acá, no en el html.
// ===================================================================

import { apiCatalogo } from "./api";
import type { ApiCategoria, ApiJuego, ApiJuegoDatos } from "./api";

(() => {
  "use strict";

  // el panel es solo para administradores: hay que haber iniciado sesión con una cuenta ADMINISTRADOR.
  // (OJO: esto solo protege la pantalla; los microservicios todavía no validan el token, ver README.)
  try {
    const sesion = JSON.parse(localStorage.getItem("juegaya_sesion") || "null");
    if (!sesion || sesion.rol !== "ADMINISTRADOR") {
      window.location.href = "iniciar-sesion.html";
      return;
    }
  } catch (e) {
    window.location.href = "iniciar-sesion.html";
    return;
  }

  // ----- tipos: así se ve un juego y una reserva tal cual quedan guardados en este navegador -----

  type Categoria = "Inflable" | "Acuático" | "Interior";

  interface Juego {
    id: string;
    nombre: string;
    categoria: Categoria;
    precio: number; // precio por la jornada completa, osea 6 horas
    descripcion: string;
    activo: boolean; // si lo pongo en false, el cliente ya no lo ve en el catálogo
    imagenUrl?: string; // no se edita acá, pero se conserva al guardar
    capacidad?: string; // idem
  }

  type EstadoReserva = "pendiente" | "confirmada" | "completada" | "cancelada";

  interface Reserva {
    id: string;
    codigo: string; // el código cortito que le muestro al cliente, tipo "JY-4F2KQ"
    cliente: string;
    telefono: string;
    juegoId: string;
    fecha: string; // viene como "YYYY-MM-DD"
    horas: number; // entre 1 y 6
    total: number;
    estado: EstadoReserva;
  }

  // esto es literalmente lo que termina guardado en localStorage bajo la clave CLAVE
  interface DatosAdmin {
    juegos: Juego[];
    reservas: Reserva[];
  }

  // ojo: esta es la MISMA clave que lee app.js del lado del cliente para armar el catálogo,
  // así que si la cambio acá hay que cambiarla allá también o se desconecta todo
  const CLAVE = "juegaya-admin-v1";

  const ESTADOS: Record<EstadoReserva, string> = {
    pendiente: "Pendiente",
    confirmada: "Confirmada",
    completada: "Completada",
    cancelada: "Cancelada"
  };

  // atajo pa' no escribir document.querySelector cien veces. ojo que asumo que el elemento
  // siempre está (esto es un panel fijo, no una página que cambia), por eso el "!" al final
  const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document): T => r.querySelector<T>(s)!;

  const clp = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" });

  // por si un nombre de juego o de cliente trae comillas o signos raros y me rompe el html
  const esc = (t: unknown): string => {
    const mapa: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return String(t ?? "").replace(/[&<>"']/g, c => mapa[c]);
  };

  const aISO = (d: Date): string => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const fecha = (iso: string): string => new Date(iso + "T12:00:00").toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" });
  const idNuevo = (): string => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const precioHora = (j: Juego): number => Math.round(j.precio / 6);

  // ---------- los datos (todo vive en este navegador, no hay servidor detrás) ----------
  function datosEjemplo(): DatosAdmin {
    return { juegos: [], reservas: [] };
  }

  let datos: DatosAdmin;
  let respaldoEnMemoria = false; // se pone true si el navegador no me deja guardar (modo incógnito, cupo lleno, etc)

  // trata de leer lo que ya había guardado antes; si no hay nada o viene corrupto, parte con los datos de ejemplo
  function cargar(): DatosAdmin {
    try {
      const guardado = localStorage.getItem(CLAVE);
      if (guardado) {
        const d = JSON.parse(guardado);
        if (d && Array.isArray(d.reservas)) return { juegos: [], reservas: d.reservas };
      }
    } catch (e) { respaldoEnMemoria = true; }
    return datosEjemplo();
  }

  function guardar(): void {
    try {
      // "juegos: []" a propósito: los juegos NO se guardan acá, viven en el Catalogo
      localStorage.setItem(CLAVE, JSON.stringify({ juegos: [], reservas: datos.reservas }));
    } catch (e) {
      respaldoEnMemoria = true;
      aviso("Este navegador no permite guardar: usa Exportar para no perder los datos");
    }
  }

  // ---------- juegos: vienen y van al microservicio Catalogo (puerto 8081) ----------
  const CATEGORIA_DESDE_API: Record<ApiCategoria, Categoria> = { INFLABLE: "Inflable", ACUATICO: "Acuático", INTERIOR: "Interior" };
  const CATEGORIA_A_API: Record<Categoria, ApiCategoria> = { "Inflable": "INFLABLE", "Acuático": "ACUATICO", "Interior": "INTERIOR" };

  const aJuegoAdmin = (j: ApiJuego): Juego => ({
    id: j.id, nombre: j.nombre, categoria: CATEGORIA_DESDE_API[j.categoria] || "Interior", precio: j.precioJornada,
    descripcion: j.descripcion || "", activo: j.activo, imagenUrl: j.imagenUrl || "", capacidad: j.capacidad || ""
  });
  const aDatosApi = (j: Omit<Juego, "id">): ApiJuegoDatos => ({
    nombre: j.nombre, categoria: CATEGORIA_A_API[j.categoria], precioJornada: j.precio, descripcion: j.descripcion,
    imagenUrl: j.imagenUrl || undefined, capacidad: j.capacidad || undefined, activo: j.activo
  });

  // trae todos los juegos (también los ocultos) desde la base de datos
  async function cargarJuegos(): Promise<void> {
    try {
      datos.juegos = (await apiCatalogo.listarTodos()).map(aJuegoAdmin);
    } catch (e) {
      aviso((e as Error).message);
    }
  }

  datos = cargar();

  let avisoTimer: ReturnType<typeof setTimeout>;

  // el cartelito gris que aparece abajo avisando "Juego creado", "Reserva eliminada", etc
  function aviso(texto: string): void {
    const el = $("#aviso");
    el.textContent = texto;
    el.classList.add("visible");
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(() => el.classList.remove("visible"), 2600);
  }

  const juegoPorId = (id: string): Juego | undefined => datos.juegos.find(j => j.id === id);
  const codigoReserva = (): string => "JY-" + Math.random().toString(36).slice(2, 7).toUpperCase();
  // una reserva "ocupa" el juego ese día si todavía está pendiente o confirmada (no si la cancelaron o ya pasó)
  const ocupa = (r: Reserva): boolean => r.estado === "pendiente" || r.estado === "confirmada";
  // reviso si ya hay otra reserva activa para el mismo juego en la misma fecha, pa' no reservar el mismo juego dos veces el mismo día
  const hayChoque = (juegoId: string, f: string, ignorarId?: string): boolean =>
    datos.reservas.some(r => r.juegoId === juegoId && r.fecha === f && ocupa(r) && r.id !== ignorarId);

  // ---------- en qué pestaña estoy parado ----------
  let vista: "resumen" | "juegos" | "reservas" = "resumen";
  let filtroEstado = "";

  // repinta el contenido según la pestaña activa. así de simple: borro todo y lo vuelvo a armar
  function pintar(): void {
    document.querySelectorAll<HTMLButtonElement>("nav button").forEach(b =>
      b.setAttribute("aria-selected", String(b.dataset.vista === vista))
    );
    const vistas: Record<"resumen" | "juegos" | "reservas", () => string> = {
      resumen: vistaResumen,
      juegos: vistaJuegos,
      reservas: vistaReservas
    };
    $("#contenido").innerHTML = vistas[vista]() + pieRespaldo();
  }

  // la pestaña de inicio: cuatro numeritos grandes + los próximos eventos
  function vistaResumen(): string {
    const pendientes = datos.reservas.filter(r => r.estado === "pendiente").length;
    const confirmadas = datos.reservas.filter(r => r.estado === "confirmada").length;
    const ingresos = datos.reservas
      .filter(r => r.estado === "confirmada" || r.estado === "completada")
      .reduce((t, r) => t + r.total, 0);
    const activos = datos.juegos.filter(j => j.activo).length;
    const hoy = aISO(new Date());
    const proximas = datos.reservas
      .filter(r => ocupa(r) && r.fecha >= hoy)
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .slice(0, 5);

    return `
      <div class="cabecera"><div><h2>Resumen</h2><p>Lo importante de tu negocio de un vistazo.</p></div></div>
      <div class="indicadores">
        <div class="indicador"><strong>${pendientes}</strong><span>Reservas por confirmar</span></div>
        <div class="indicador"><strong>${confirmadas}</strong><span>Reservas confirmadas</span></div>
        <div class="indicador"><strong>${clp.format(ingresos)}</strong><span>Ingresos confirmados</span></div>
        <div class="indicador"><strong>${activos}</strong><span>Juegos visibles</span></div>
      </div>
      <h2 style="font-size:1.05rem;margin:2rem 0 .75rem">Próximos eventos</h2>
      <div class="panel">${proximas.length ? `<div class="scroll"><table>
        <thead><tr><th>Fecha</th><th>Cliente</th><th>Juego</th><th>Estado</th></tr></thead>
        <tbody>${proximas.map(r => `<tr><td>${fecha(r.fecha)}</td><td>${esc(r.cliente)}</td>
          <td>${esc((juegoPorId(r.juegoId) || { nombre: "Juego eliminado" }).nombre)}</td><td>${ESTADOS[r.estado]}</td></tr>`).join("")}</tbody></table></div>`
        : `<div class="vacio">No hay eventos próximos.</div>`}</div>`;
  }

  // la pestaña de juegos: la tabla con el catálogo completo (los activos y los ocultos)
  function vistaJuegos(): string {
    return `
      <div class="cabecera">
        <div><h2>Juegos</h2><p>Los juegos que ofreces y cuánto cuestan.</p></div>
        <button class="btn primario" data-accion="nuevo-juego">+ Nuevo juego</button>
      </div>
      <div class="panel">${datos.juegos.length ? `<div class="scroll"><table>
        <thead><tr><th>Juego</th><th>Categoría</th><th class="num">Precio jornada</th><th>Estado</th><th></th></tr></thead>
        <tbody>${datos.juegos.map(j => `<tr>
          <td><strong>${esc(j.nombre)}</strong><span class="sec">${esc(j.descripcion)}</span></td>
          <td>${esc(j.categoria)}</td>
          <td class="num">${clp.format(j.precio)}<span class="sec">${clp.format(precioHora(j))} por hora</span></td>
          <td><span class="chip ${j.activo ? "ok" : "off"}">${j.activo ? "Visible" : "Oculto"}</span></td>
          <td class="acciones">
            <button class="btn chico" data-accion="editar-juego" data-id="${esc(j.id)}">Editar</button>
            <button class="btn chico" data-accion="alternar-juego" data-id="${esc(j.id)}">${j.activo ? "Ocultar" : "Mostrar"}</button>
            <button class="btn chico peligro" data-accion="borrar-juego" data-id="${esc(j.id)}">Eliminar</button>
          </td></tr>`).join("")}</tbody></table></div>`
        : `<div class="vacio">Aún no tienes juegos. Crea el primero con “Nuevo juego”.</div>`}</div>`;
  }

  // la pestaña de reservas: se puede filtrar por estado y cambiar el estado desde el mismo select
  function vistaReservas(): string {
    const lista = datos.reservas
      .filter(r => !filtroEstado || r.estado === filtroEstado)
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
    return `
      <div class="cabecera">
        <div><h2>Reservas</h2><p>Confirma, completa o cancela cada reserva.</p></div>
        <button class="btn primario" data-accion="nueva-reserva">+ Nueva reserva</button>
      </div>
      <div class="filtros">
        <select class="btn" id="filtroEstado" aria-label="Filtrar por estado">
          <option value="">Todos los estados</option>
          ${Object.entries(ESTADOS).map(([v, t]) => `<option value="${v}"${filtroEstado === v ? " selected" : ""}>${t}</option>`).join("")}
        </select>
      </div>
      <div class="panel">${lista.length ? `<div class="scroll"><table>
        <thead><tr><th>Código</th><th>Cliente</th><th>Juego</th><th>Fecha</th><th class="num">Total</th><th>Estado</th><th></th></tr></thead>
        <tbody>${lista.map(r => `<tr>
          <td><strong>${esc(r.codigo)}</strong></td>
          <td>${esc(r.cliente)}<span class="sec">${esc(r.telefono)}</span></td>
          <td>${esc((juegoPorId(r.juegoId) || { nombre: "Juego eliminado" }).nombre)}<span class="sec">${r.horas} h</span></td>
          <td>${fecha(r.fecha)}</td>
          <td class="num">${clp.format(r.total)}</td>
          <td><select class="btn chico" data-estado="${esc(r.id)}" aria-label="Estado de ${esc(r.codigo)}">
            ${Object.entries(ESTADOS).map(([v, t]) => `<option value="${v}"${r.estado === v ? " selected" : ""}>${t}</option>`).join("")}
          </select></td>
          <td class="acciones"><button class="btn chico peligro" data-accion="borrar-reserva" data-id="${esc(r.id)}">Eliminar</button></td>
        </tr>`).join("")}</tbody></table></div>`
        : `<div class="vacio">${datos.reservas.length ? "Ninguna reserva coincide con el filtro." : "Aún no hay reservas."}</div>`}</div>`;
  }

  // el pie de página con los botones de exportar/importar/restablecer, se repite en las 3 pestañas
  function pieRespaldo(): string {
    return `<div class="respaldo">
      <p>Los juegos se guardan en el servidor (microservicio Catalogo). Las reservas de esta pestaña son manuales y solo viven en este navegador: exporta una copia para no perderlas.</p>
      <button class="btn chico" data-accion="exportar">Exportar copia</button>
      <button class="btn chico" data-accion="importar">Importar copia</button>
      <button class="btn chico peligro" data-accion="reiniciar">Borrar reservas</button>
      <input type="file" id="archivoImportar" accept="application/json" hidden>
    </div>`;
  }

  // ---------- el formulario de "nuevo juego" / "editar juego" ----------
  function abrirJuego(juego: Juego | null): void {
    $("#dlgJuegoTitulo").textContent = juego ? "Editar juego" : "Nuevo juego";
    $<HTMLInputElement>("#jId").value = juego ? juego.id : "";
    $<HTMLInputElement>("#jNombre").value = juego ? juego.nombre : "";
    $<HTMLSelectElement>("#jCategoria").value = juego ? juego.categoria : "Inflable";
    $<HTMLInputElement>("#jPrecio").value = juego ? String(juego.precio) : "";
    $<HTMLTextAreaElement>("#jDescripcion").value = juego ? juego.descripcion : "";
    $<HTMLInputElement>("#jActivo").checked = juego ? juego.activo : true;
    $<HTMLDialogElement>("#dlgJuego").showModal();
    $<HTMLInputElement>("#jNombre").focus();
  }

  $("#formJuego").addEventListener("submit", async () => {
    const id = $<HTMLInputElement>("#jId").value;
    const nuevo = {
      nombre: $<HTMLInputElement>("#jNombre").value.trim(),
      categoria: $<HTMLSelectElement>("#jCategoria").value as Categoria,
      precio: parseInt($<HTMLInputElement>("#jPrecio").value, 10),
      descripcion: $<HTMLTextAreaElement>("#jDescripcion").value.trim(),
      activo: $<HTMLInputElement>("#jActivo").checked
    };
    if (!nuevo.nombre || !(nuevo.precio > 0)) return; // validación mínima, nada raro
    try {
      if (id) {
        const existente = juegoPorId(id);
        await apiCatalogo.editar(id, aDatosApi({ ...nuevo, imagenUrl: existente?.imagenUrl, capacidad: existente?.capacidad }));
      } else {
        await apiCatalogo.crear(aDatosApi(nuevo));
      }
      await cargarJuegos();
      pintar();
      aviso(id ? "Juego actualizado" : "Juego creado");
    } catch (e) {
      aviso((e as Error).message);
    }
  });

  // ---------- el formulario de "nueva reserva" ----------
  // esto solo actualiza el textito de "Total: $X" mientras eligen el juego o cambian las horas
  function actualizarTotalReserva(): void {
    const j = juegoPorId($<HTMLSelectElement>("#rJuego").value);
    const horas = Math.min(6, Math.max(1, parseInt($<HTMLInputElement>("#rHoras").value, 10) || 0));
    $("#rTotal").textContent = j && horas ? `Total: ${clp.format(precioHora(j) * horas)} (${clp.format(precioHora(j))} por hora)` : "";
  }

  function abrirReserva(): void {
    const disponibles = datos.juegos.filter(j => j.activo);
    if (!disponibles.length) { aviso("Primero crea o muestra al menos un juego"); return; }
    ($("#formReserva") as HTMLFormElement).reset();
    $("#rJuego").innerHTML = disponibles.map(j => `<option value="${esc(j.id)}">${esc(j.nombre)}</option>`).join("");
    $<HTMLInputElement>("#rFecha").min = aISO(new Date());
    $<HTMLInputElement>("#rHoras").value = "6";
    actualizarTotalReserva();
    $<HTMLDialogElement>("#dlgReserva").showModal();
    $<HTMLInputElement>("#rCliente").focus();
  }

  $("#rJuego").addEventListener("change", actualizarTotalReserva);
  $("#rHoras").addEventListener("input", actualizarTotalReserva);

  $("#formReserva").addEventListener("submit", evento => {
    const juegoId = $<HTMLSelectElement>("#rJuego").value;
    const f = $<HTMLInputElement>("#rFecha").value;
    const horas = Math.min(6, Math.max(1, parseInt($<HTMLInputElement>("#rHoras").value, 10) || 0));
    if (hayChoque(juegoId, f)) {
      evento.preventDefault(); // el dialog es method="dialog", así que si no la freno acá se cierra solo igual
      aviso("Ese juego ya está reservado para esa fecha");
      return;
    }
    const juego = juegoPorId(juegoId);
    if (!juego) return;
    datos.reservas.push({
      id: idNuevo(),
      codigo: codigoReserva(),
      cliente: $<HTMLInputElement>("#rCliente").value.trim(),
      telefono: $<HTMLInputElement>("#rTelefono").value.trim(),
      juegoId,
      fecha: f,
      horas,
      total: precioHora(juego) * horas,
      estado: "pendiente"
    });
    guardar();
    pintar();
    aviso("Reserva creada");
  });

  // ---------- el resto de los clicks y cambios de la página ----------
  document.querySelector("nav")!.addEventListener("click", e => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-vista]");
    if (b) {
      vista = b.dataset.vista as "resumen" | "juegos" | "reservas";
      pintar();
    }
  });

  document.querySelectorAll<HTMLButtonElement>("[data-cerrar]").forEach(b =>
    b.addEventListener("click", () => (b.closest("dialog") as HTMLDialogElement).close())
  );

  // acá caen casi todos los botones con data-accion (crear, editar, borrar, exportar, etc), uso delegación
  // de eventos porque varios de estos botones se crean recién al pintar las tablas
  $("#contenido").addEventListener("click", async e => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-accion]");
    if (!b) return;
    const id = b.dataset.id as string;
    switch (b.dataset.accion) {
      case "nuevo-juego":
        abrirJuego(null);
        break;
      case "editar-juego": {
        const j = juegoPorId(id);
        if (j) abrirJuego(j);
        break;
      }
      case "alternar-juego": {
        const j = juegoPorId(id);
        if (j) {
          try {
            const { id: _omitido, ...resto } = j;
            await apiCatalogo.editar(j.id, aDatosApi({ ...resto, activo: !j.activo }));
            await cargarJuegos();
            pintar();
            aviso(j.activo ? "Juego oculto" : "Juego visible");
          } catch (err) { aviso((err as Error).message); }
        }
        break;
      }
      case "borrar-juego": {
        const j = juegoPorId(id);
        if (!j) break;
        const enUso = datos.reservas.some(r => r.juegoId === id && ocupa(r));
        if (enUso) { aviso("Tiene reservas activas: cancélalas antes o solo ocúltalo"); break; }
        if (confirm(`¿Eliminar “${j.nombre}”? No se puede deshacer.`)) {
          try {
            await apiCatalogo.eliminar(id);
            await cargarJuegos();
            pintar();
            aviso("Juego eliminado");
          } catch (err) { aviso((err as Error).message); }
        }
        break;
      }
      case "nueva-reserva":
        abrirReserva();
        break;
      case "borrar-reserva":
        if (confirm("¿Eliminar esta reserva? Si solo quieres liberarla, mejor cámbiala a Cancelada.")) {
          datos.reservas = datos.reservas.filter(x => x.id !== id);
          guardar();
          pintar();
          aviso("Reserva eliminada");
        }
        break;
      case "exportar": {
        // esto arma un archivo .json al vuelo y lo descarga, como si fuera un "backup manual"
        const enlace = document.createElement("a");
        enlace.href = URL.createObjectURL(new Blob([JSON.stringify(datos, null, 2)], { type: "application/json" }));
        enlace.download = `juegaya-copia-${aISO(new Date())}.json`;
        enlace.click();
        URL.revokeObjectURL(enlace.href);
        break;
      }
      case "importar":
        $("#archivoImportar").click();
        break;
      case "reiniciar":
        if (confirm("¿Borrar las reservas manuales guardadas en este navegador? (los juegos no se tocan)")) {
          datos.reservas = [];
          guardar();
          pintar();
          aviso("Reservas borradas");
        }
        break;
    }
  });

  $("#contenido").addEventListener("change", e => {
    const objetivo = e.target as HTMLElement;

    if (objetivo.id === "filtroEstado") {
      filtroEstado = (objetivo as HTMLSelectElement).value;
      pintar();
      return;
    }

    if (objetivo.dataset.estado) {
      const r = datos.reservas.find(x => x.id === objetivo.dataset.estado);
      if (!r) return;
      const nuevo = (objetivo as HTMLSelectElement).value as EstadoReserva;
      if ((nuevo === "pendiente" || nuevo === "confirmada") && hayChoque(r.juegoId, r.fecha, r.id)) {
        aviso("Ese juego ya está reservado para esa fecha");
        pintar(); // repinto para que el select vuelva a mostrar el estado anterior
        return;
      }
      r.estado = nuevo;
      guardar();
      pintar();
      aviso("Estado actualizado");
      return;
    }

    // esto es cuando eligen un archivo en el input de "Importar copia"
    if (objetivo.id === "archivoImportar") {
      const input = objetivo as HTMLInputElement;
      const archivo = input.files?.[0];
      if (!archivo) return;
      const lector = new FileReader();
      lector.onload = () => {
        try {
          const d = JSON.parse(lector.result as string);
          if (!d || !Array.isArray(d.juegos) || !Array.isArray(d.reservas)) throw new Error("formato");
          datos.reservas = d.reservas; // los juegos no se importan: viven en el servidor
          guardar();
          pintar();
          aviso("Copia importada");
        } catch (err) {
          aviso("El archivo no es una copia válida de JuegaYa");
        }
      };
      lector.readAsText(archivo);
    }
  });

  // y acá se prende todo apenas carga la página
  pintar();
  cargarJuegos().then(pintar);
  if (respaldoEnMemoria) aviso("Este navegador no permite guardar: usa Exportar para no perder los datos");
})();
