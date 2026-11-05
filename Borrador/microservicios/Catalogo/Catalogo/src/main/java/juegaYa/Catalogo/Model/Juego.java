package juegaYa.Catalogo.Model;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
/**
 * Un juego/inflable que se puede arrendar. Es el agregado central del catálogo:
 * Resena, HorarioDeAtencion y BloqueoFecha se guardan en sus propias tablas y se
 * relacionan con esta clase a través de {//@code juegoId} (no por mapeo JPA directo),
 * siguiendo el mismo criterio que ya usaba el prototipo del front (ids de tipo String).
 *
 * Las listas de resenas y bloqueos NO se persisten junto con el juego: las carga el
 * CatalogoService (desde sus respectivos repositorios) y se las entrega a esta entidad
 * cuando necesita calcular algo que depende de ellas (promedio de estrellas,
 * disponibilidad por fecha). Por eso van marcadas con @Transient.
 */
@Entity
@Table(name = "juego")
public class Juego {
    @Id
    private String id;
    @NotBlank
    private String nombre;
    @NotNull
    @Enumerated(EnumType.STRING)
    private Categoria categoria;
    @Positive
    private int precioJornada;
    private String descripcion;
    private String imagenUrl;
    private String capacidad;
    private boolean activo = true;
    @Transient
    private List<Resena> resenas = new ArrayList<>();
    @Transient
    private List<BloqueoFecha> bloqueos = new ArrayList<>();
    protected Juego() {
        // constructor vacío que pide JPA
    }
    public Juego(String id, String nombre, Categoria categoria, int precioJornada,
                String descripcion, String imagenUrl, String capacidad, boolean activo) {
        this.id = id;
        this.nombre = nombre;
        this.categoria = categoria;
        this.precioJornada = precioJornada;
        this.descripcion = descripcion;
        this.imagenUrl = imagenUrl;
        this.capacidad = capacidad;
        this.activo = activo;
    }

    /** Precio de la hora suelta, asumiendo que una jornada completa son 6 horas. */
    public int precioPorHora() {
        return precioJornada / 6;
    }

    /** Promedio de estrellas según las resenas cargadas con {//@link #setResenas(List)}. */
    public float promedioEstrellas() {
        if (resenas == null || resenas.isEmpty()) {
            return 0f;
        }
        double suma = resenas.stream().mapToInt(Resena::getEstrellas).sum();
        return (float) (suma / resenas.size());
    }

    /** Invierte la visibilidad del juego en el catálogo público. */
    public void alternarVisibilidad() {
        this.activo = !this.activo;
    }

    /**
     * Indica si el juego se puede arrendar en una fecha dada: tiene que estar activo
     * y no tener ningún bloqueo (reserva, mantención o bloqueo manual) para ese día.
     * Los bloqueos a considerar se cargan antes con {@link #setBloqueos(List)}.
     */
    public boolean estaDisponible(LocalDate fecha) {
        if (!activo || fecha == null) {
            return false;
        }
        if (bloqueos == null) {
            return true;
        }
        return bloqueos.stream().noneMatch(b -> fecha.equals(b.getFecha()));
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public Categoria getCategoria() {
        return categoria;
    }

    public void setCategoria(Categoria categoria) {
        this.categoria = categoria;
    }

    public int getPrecioJornada() {
        return precioJornada;
    }

    public void setPrecioJornada(int precioJornada) {
        this.precioJornada = precioJornada;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getImagenUrl() {
        return imagenUrl;
    }

    public void setImagenUrl(String imagenUrl) {
        this.imagenUrl = imagenUrl;
    }

    public String getCapacidad() {
        return capacidad;
    }

    public void setCapacidad(String capacidad) {
        this.capacidad = capacidad;
    }

    public boolean isActivo() {
        return activo;
    }

    public void setActivo(boolean activo) {
        this.activo = activo;
    }

    public List<Resena> getResenas() {
        return resenas;
    }

    /** El servicio llama esto después de buscar las resenas del juego en su repositorio. */
    public void setResenas(List<Resena> resenas) {
        this.resenas = resenas;
    }

    public List<BloqueoFecha> getBloqueos() {
        return bloqueos;
    }

    /** El servicio llama esto después de buscar los bloqueos del juego en su repositorio. */
    public void setBloqueos(List<BloqueoFecha> bloqueos) {
        this.bloqueos = bloqueos;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Juego)) return false;
        Juego juego = (Juego) o;
        return Objects.equals(id, juego.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "Juego{id='" + id + "', nombre='" + nombre + "', categoria=" + categoria
                + ", precioJornada=" + precioJornada + ", activo=" + activo + "}";
    }
}