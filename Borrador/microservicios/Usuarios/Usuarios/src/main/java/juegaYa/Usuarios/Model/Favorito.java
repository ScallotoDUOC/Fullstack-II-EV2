package juegaYa.Usuarios.Model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Juego marcado como favorito por un usuario. Se enlaza por id (usuarioId, juegoId),
 * igual que el resto de los microservicios, y la pareja es única para que un
 * usuario no pueda tener el mismo favorito dos veces.
 */
@Entity
@Table(name = "favorito", uniqueConstraints = @UniqueConstraint(columnNames = {"usuarioId", "juegoId"}))
public class Favorito {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Column(nullable = false)
    private Integer usuarioId;

    @NotBlank
    @Column(nullable = false)
    private String juegoId;

    protected Favorito() {
        // constructor vacío que pide JPA
    }

    public Favorito(Integer usuarioId, String juegoId) {
        this.usuarioId = usuarioId;
        this.juegoId = juegoId;
    }

    public Long getId() {
        return id;
    }

    public Integer getUsuarioId() {
        return usuarioId;
    }

    public String getJuegoId() {
        return juegoId;
    }
}
