package juegaYa.Usuarios.Model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

/**
 * Sesión abierta por un usuario al iniciar sesión. El diagrama no le define un
 * id propio, así que el {//@code token} hace de llave primaria (es único por
 * definición). Se enlaza con el usuario por {//@code usuarioId}, igual que el
 * resto de los microservicios enlazan por id y no por relación JPA directa.
 */
@Entity
@Table(name = "sesion")
public class Sesion {

    @Id
    @NotBlank
    private String token;

    @NotNull
    private Integer usuarioId;

    private LocalDateTime creadaEn;

    private LocalDateTime expiraEn;

    protected Sesion() {
        // constructor vacío que pide JPA
    }

    public Sesion(String token, Integer usuarioId, LocalDateTime creadaEn, LocalDateTime expiraEn) {
        this.token = token;
        this.usuarioId = usuarioId;
        this.creadaEn = creadaEn;
        this.expiraEn = expiraEn;
    }

    /** Abre una sesión nueva para un usuario, con un token aleatorio y la duración indicada. */
    public static Sesion abrir(Integer usuarioId, Duration duracion) {
        LocalDateTime ahora = LocalDateTime.now();
        return new Sesion(UUID.randomUUID().toString(), usuarioId, ahora, ahora.plus(duracion));
    }

    /** La sesión sirve mientras no haya llegado su fecha de expiración. */
    public boolean estaVigente() {
        return expiraEn != null && LocalDateTime.now().isBefore(expiraEn);
    }

    /** Cierra la sesión adelantando su expiración al momento actual. */
    public void cerrar() {
        this.expiraEn = LocalDateTime.now();
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public Integer getUsuarioId() {
        return usuarioId;
    }

    public void setUsuarioId(Integer usuarioId) {
        this.usuarioId = usuarioId;
    }

    public LocalDateTime getCreadaEn() {
        return creadaEn;
    }

    public void setCreadaEn(LocalDateTime creadaEn) {
        this.creadaEn = creadaEn;
    }

    public LocalDateTime getExpiraEn() {
        return expiraEn;
    }

    public void setExpiraEn(LocalDateTime expiraEn) {
        this.expiraEn = expiraEn;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Sesion)) return false;
        Sesion sesion = (Sesion) o;
        return Objects.equals(token, sesion.token);
    }

    @Override
    public int hashCode() {
        return Objects.hash(token);
    }

    @Override
    public String toString() {
        return "Sesion{usuarioId=" + usuarioId + ", creadaEn=" + creadaEn + ", expiraEn=" + expiraEn + "}";
    }
}
