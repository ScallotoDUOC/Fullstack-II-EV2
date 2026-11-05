package juegaYa.Catalogo.Model;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;
import java.util.Objects;

/**
 * Reseña que un cliente deja sobre un juego después de arrendarlo.
 * Se guarda en su propia tabla y se referencia al juego por {//@code juegoId}
 * (mismo criterio que BloqueoFecha), no por una relación JPA directa.
 */
@Entity
@Table(name = "resena")
public class Resena {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @NotBlank
    private String juegoId;

    private int usuarioId;

    @NotBlank
    private String autor;

    @Min(1)
    @Max(5)
    private int estrellas;

    private String comentario;

    private LocalDate fecha;

    protected Resena() {
        // constructor vacío que pide JPA
    }

    public Resena(String juegoId, int usuarioId, String autor, int estrellas,
                String comentario, LocalDate fecha) {
        this.juegoId = juegoId;
        this.usuarioId = usuarioId;
        this.autor = autor;
        this.estrellas = estrellas;
        this.comentario = comentario;
        this.fecha = fecha;
    }

    /** Reseña mínimamente válida: tiene autor y las estrellas están entre 1 y 5. */
    public boolean validar() {
        return autor != null && !autor.isBlank() && estrellas >= 1 && estrellas <= 5;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getJuegoId() {
        return juegoId;
    }

    public void setJuegoId(String juegoId) {
        this.juegoId = juegoId;
    }

    public int getUsuarioId() {
        return usuarioId;
    }

    public void setUsuarioId(int usuarioId) {
        this.usuarioId = usuarioId;
    }

    public String getAutor() {
        return autor;
    }

    public void setAutor(String autor) {
        this.autor = autor;
    }

    public int getEstrellas() {
        return estrellas;
    }

    public void setEstrellas(int estrellas) {
        this.estrellas = estrellas;
    }

    public String getComentario() {
        return comentario;
    }

    public void setComentario(String comentario) {
        this.comentario = comentario;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Resena)) return false;
        Resena resena = (Resena) o;
        return Objects.equals(id, resena.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "Resena{id=" + id + ", juegoId='" + juegoId + "', autor='" + autor
                + "', estrellas=" + estrellas + "}";
    }
}