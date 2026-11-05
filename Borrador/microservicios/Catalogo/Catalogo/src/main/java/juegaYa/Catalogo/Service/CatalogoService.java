package juegaYa.Catalogo.Service;

import juegaYa.Catalogo.Dto.JuegoDatos;
import juegaYa.Catalogo.Dto.RangoPrecio;
import juegaYa.Catalogo.Exception.RecursoNoEncontradoException;
import juegaYa.Catalogo.Model.BloqueoFecha;
import juegaYa.Catalogo.Model.Categoria;
import juegaYa.Catalogo.Model.Juego;
import juegaYa.Catalogo.Model.MotivoBloqueo;
import juegaYa.Catalogo.Model.Resena;
import juegaYa.Catalogo.Repository.BloqueoFechaRepository;
import juegaYa.Catalogo.Repository.JuegoRepository;
import juegaYa.Catalogo.Repository.ResenaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Implementa las operaciones de CatalogoService del diagrama. Ojo con una
 * diferencia respecto al diagrama: ahí aparece un solo "CatalogoRepository" con
 * 4 métodos (guardarJuego, buscarJuegos, guardarBloqueo, buscarBloqueos), pero
 * ese repositorio no alcanza para cubrir reseñas, ni para obtener/eliminar un
 * juego puntual. Acá usé el patrón estándar de Spring Data: un repositorio JPA
 * por entidad (JuegoRepository, ResenaRepository, BloqueoFechaRepository), que
 * además te da gratis los métodos que el diagrama pedía (guardarJuego = save,
 * buscarJuegos = findAll, etc). Si para la entrega necesitas que el nombre
 * "CatalogoRepository" exista tal cual el diagrama, dime y te armo esa fachada
 * encima de estos tres repositorios.
 */
@Service
public class CatalogoService {

    private static final Pattern NO_ALFANUMERICO = Pattern.compile("[^a-z0-9]+");
    private static final Pattern GUION_EN_BORDE = Pattern.compile("(^-+|-+$)");

    private final JuegoRepository juegoRepository;
    private final ResenaRepository resenaRepository;
    private final BloqueoFechaRepository bloqueoFechaRepository;

    public CatalogoService(JuegoRepository juegoRepository,
                            ResenaRepository resenaRepository,
                            BloqueoFechaRepository bloqueoFechaRepository) {
        this.juegoRepository = juegoRepository;
        this.resenaRepository = resenaRepository;
        this.bloqueoFechaRepository = bloqueoFechaRepository;
    }

    /**
     * Catálogo público: solo juegos activos, con los filtros opcionales que vengan
     * (cualquiera puede venir null/vacío, ahí simplemente no se aplica ese filtro).
     */
    @Transactional(readOnly = true)
    public List<Juego> listar(Categoria categoria, String texto, RangoPrecio rangoPrecio) {
        return listar(categoria, texto, rangoPrecio, false);
    }

    /** Igual que el anterior; con incluirInactivos=true también trae los juegos ocultos (lo usa el panel admin). */
    @Transactional(readOnly = true)
    public List<Juego> listar(Categoria categoria, String texto, RangoPrecio rangoPrecio, boolean incluirInactivos) {
        String textoNormalizado = (texto == null) ? "" : texto.trim().toLowerCase(Locale.ROOT);

        return juegoRepository.findAll().stream()
                .filter(j -> incluirInactivos || j.isActivo())
                .filter(j -> categoria == null || categoria.equals(j.getCategoria()))
                .filter(j -> textoNormalizado.isEmpty()
                        || j.getNombre().toLowerCase(Locale.ROOT).contains(textoNormalizado))
                .filter(j -> rangoPrecio == null || rangoPrecio.contiene(j.getPrecioJornada()))
                .map(this::conResenas)
                .collect(Collectors.toList());
    }

    /** Trae un juego por id, con sus reseñas y bloqueos ya cargados. */
    @Transactional(readOnly = true)
    public Juego obtener(String id) {
        Juego juego = juegoRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe un juego con id " + id));
        return conResenasYBloqueos(juego);
    }

    /** Crea un juego nuevo. El id se genera a partir del nombre (ej. "Castillo Aventura" -> "castillo-aventura"). */
    @Transactional
    public Juego crear(JuegoDatos datos) {
        Juego juego = new Juego(
                generarId(datos.nombre()),
                datos.nombre(),
                datos.categoria(),
                datos.precioJornada(),
                datos.descripcion(),
                datos.imagenUrl(),
                datos.capacidad(),
                datos.activo()
        );
        return juegoRepository.save(juego);
    }

    /** Edita un juego existente. Lanza RecursoNoEncontradoException si el id no existe. */
    @Transactional
    public Juego editar(String id, JuegoDatos datos) {
        Juego juego = juegoRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe un juego con id " + id));
        juego.setNombre(datos.nombre());
        juego.setCategoria(datos.categoria());
        juego.setPrecioJornada(datos.precioJornada());
        juego.setDescripcion(datos.descripcion());
        juego.setImagenUrl(datos.imagenUrl());
        juego.setCapacidad(datos.capacidad());
        juego.setActivo(datos.activo());
        return juegoRepository.save(juego);
    }

    /** Elimina un juego. Devuelve false (en vez de lanzar excepción) si el id no existía. */
    @Transactional
    public boolean eliminar(String id) {
        if (!juegoRepository.existsById(id)) {
            return false;
        }
        juegoRepository.deleteById(id);
        return true;
    }

    /** Agrega una reseña a un juego, validándola antes de guardarla. */
    @Transactional
    public Resena agregarResena(String juegoId, Resena resena) {
        if (!juegoRepository.existsById(juegoId)) {
            throw new RecursoNoEncontradoException("No existe un juego con id " + juegoId);
        }
        resena.setJuegoId(juegoId);
        if (!resena.validar()) {
            throw new IllegalArgumentException("La reseña no es válida: falta autor o las estrellas no están entre 1 y 5");
        }
        return resenaRepository.save(resena);
    }

    /** Juegos activos que no tienen ningún bloqueo para esa fecha. */
    @Transactional(readOnly = true)
    public List<Juego> juegosDisponibles(LocalDate fecha) {
        return juegoRepository.findAll().stream()
                .filter(Juego::isActivo)
                .map(this::conBloqueos)
                .filter(j -> j.estaDisponible(fecha))
                .collect(Collectors.toList());
    }

    /**
     * Bloquea una fecha para un juego. Si viene reservaId, el motivo queda como
     * RESERVA (lo crea el flujo de reservas); si no, queda como MANUAL (lo hizo
     * el administrador a mano).
     */
    @Transactional
    public BloqueoFecha bloquear(String juegoId, LocalDate fecha, Integer reservaId) {
        if (!juegoRepository.existsById(juegoId)) {
            throw new RecursoNoEncontradoException("No existe un juego con id " + juegoId);
        }
        MotivoBloqueo motivo = (reservaId != null) ? MotivoBloqueo.RESERVA : MotivoBloqueo.MANUAL;
        BloqueoFecha bloqueo = new BloqueoFecha(juegoId, fecha, motivo, reservaId);
        return bloqueoFechaRepository.save(bloqueo);
    }

    /**
     * Libera todos los bloqueos que quedaron asociados a una reserva (por ejemplo,
     * cuando el cliente cancela). Como un bloqueo sin reservaId y con motivo RESERVA
     * ya no tiene sentido, directamente se elimina en vez de dejarlo huérfano.
     */
    @Transactional
    public void liberar(Integer reservaId) {
        List<BloqueoFecha> bloqueos = bloqueoFechaRepository.findByReservaId(reservaId);
        bloqueoFechaRepository.deleteAll(bloqueos);
    }

    private Juego conResenas(Juego juego) {
        juego.setResenas(resenaRepository.findByJuegoId(juego.getId()));
        return juego;
    }

    private Juego conBloqueos(Juego juego) {
        juego.setBloqueos(bloqueoFechaRepository.findByJuegoId(juego.getId()));
        return juego;
    }

    private Juego conResenasYBloqueos(Juego juego) {
        return conBloqueos(conResenas(juego));
    }

    /** Genera un id tipo slug a partir del nombre, y le agrega un sufijo si ya existe uno igual. */
    private String generarId(String nombre) {
        String base = quitarAcentos(nombre == null ? "" : nombre).toLowerCase(Locale.ROOT);
        base = NO_ALFANUMERICO.matcher(base).replaceAll("-");
        base = GUION_EN_BORDE.matcher(base).replaceAll("");
        if (base.isBlank()) {
            base = "juego";
        }
        String id = base;
        int sufijo = 2;
        while (juegoRepository.existsById(id)) {
            id = base + "-" + sufijo;
            sufijo++;
        }
        return id;
    }

    private String quitarAcentos(String texto) {
        return java.text.Normalizer.normalize(texto, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
    }
}