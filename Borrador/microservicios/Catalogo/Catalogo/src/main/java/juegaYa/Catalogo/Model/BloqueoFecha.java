package juegaYa.Catalogo.Model;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.Objects;

/**
 * Marca que un juego está bloqueado (no disponible para arriendo) en una fecha
 * puntual. Se crea tanto cuando se confirma una reserva (motivo RESERVA, con
 * reservaId) como cuando el administrador bloquea el día a mano o por mantención.
 */
@Entity
@Table(name = "bloqueo_fecha")
public class BloqueoFecha {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @NotBlank
    private String juegoId;
    @NotNull
    private LocalDate fecha;
    @NotNull
    @Enumerated(EnumType.STRING)
    private MotivoBloqueo motivo;
    private Integer reservaId;
    protected BloqueoFecha() {
        // constructor vacío que pide JPA
    }
    public BloqueoFecha(String juegoId, LocalDate fecha, MotivoBloqueo motivo, Integer reservaId) {
        this.juegoId = juegoId;
        this.fecha = fecha;
        this.motivo = motivo;
        this.reservaId = reservaId;
    }
    /**
     * Libera el bloqueo soltando su vínculo con la reserva que lo originó.
     * Si quedó sin reservaId y el motivo era RESERVA, el servicio puede decidir
     * eliminar directamente esta fila (ya no tiene sentido mantenerla).
     */
    public void liberar() {
        this.reservaId = null;
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
    public LocalDate getFecha() {
        return fecha;
    }
    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
    }
    public MotivoBloqueo getMotivo() {
        return motivo;
    }
    public void setMotivo(MotivoBloqueo motivo) {
        this.motivo = motivo;
    }
    public Integer getReservaId() {
        return reservaId;
    }
    public void setReservaId(Integer reservaId) {
        this.reservaId = reservaId;
    }
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof BloqueoFecha)) return false;
        BloqueoFecha that = (BloqueoFecha) o;
        return Objects.equals(id, that.id);
    }
    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
    @Override
    public String toString() {
        return "BloqueoFecha{id=" + id + ", juegoId='" + juegoId + "', fecha=" + fecha
                + ", motivo=" + motivo + ", reservaId=" + reservaId + "}";
    }
}