package juegaYa.Catalogo.Model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalTime;
import java.util.Objects;

/**
 * Horario en que un juego puede ser retirado/usado durante el día (por ejemplo,
 * "de 9:00 a 20:00"). Es una relación 1 a 1 con Juego, así que se usa el propio
 * {//@code juegoId} como llave primaria en vez de generar un id aparte.
 *
 * Nota: en el diagrama original esta clase traía un tercer atributo sin nombre
 * ni tipo definidos ("Attribute1"), aparte de horaInicio/horaFin. Lo dejé afuera
 * porque no hay cómo adivinar qué se quiso modelar ahí -lo más probable es que
 * haya sido para los días de la semana en que aplica el horario (ej. un
 * Set&lt;DayOfWeek&gt; diasAtencion)-, así que cuando tengas claro qué va,
 * se agrega como un atributo más.
 */
@Entity
@Table(name = "horario_de_atencion")
public class HorarioDeAtencion {
    @Id
    private String juegoId;
    private LocalTime horaInicio;
    private LocalTime horaFin;
    protected HorarioDeAtencion() {
        // constructor vacío que pide JPA
    }
    public HorarioDeAtencion(String juegoId, LocalTime horaInicio, LocalTime horaFin) {
        this.juegoId = juegoId;
        this.horaInicio = horaInicio;
        this.horaFin = horaFin;
    }

    /** Indica si una hora determinada cae dentro de este horario de atención. */
    public boolean contiene(LocalTime hora) {
        if (hora == null || horaInicio == null || horaFin == null) {
            return false;
        }
        return !hora.isBefore(horaInicio) && !hora.isAfter(horaFin);
    }

    public String getJuegoId() {
        return juegoId;
    }

    public void setJuegoId(String juegoId) {
        this.juegoId = juegoId;
    }

    public LocalTime getHoraInicio() {
        return horaInicio;
    }

    public void setHoraInicio(LocalTime horaInicio) {
        this.horaInicio = horaInicio;
    }

    public LocalTime getHoraFin() {
        return horaFin;
    }

    public void setHoraFin(LocalTime horaFin) {
        this.horaFin = horaFin;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof HorarioDeAtencion)) return false;
        HorarioDeAtencion that = (HorarioDeAtencion) o;
        return Objects.equals(juegoId, that.juegoId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(juegoId);
    }

    @Override
    public String toString() {
        return "HorarioDeAtencion{juegoId='" + juegoId + "', horaInicio=" + horaInicio
                + ", horaFin=" + horaFin + "}";
    }
}