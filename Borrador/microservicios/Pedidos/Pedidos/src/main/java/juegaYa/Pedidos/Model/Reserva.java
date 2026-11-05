package juegaYa.Pedidos.Model;
import java.time.LocalDate;

public class Reserva {

    private String juegoId;
    private LocalDate fechaEvento;
    private int horas;
    private int precioHora;
    private EstadoReserva estado = EstadoReserva.PENDIENTE;

    public Reserva() {
    }

    public Reserva(String juegoId, LocalDate fechaEvento, int horas, int precioHora) {
        this.juegoId = juegoId;
        this.fechaEvento = fechaEvento;
        this.horas = horas;
        this.precioHora = precioHora;
    }

    public int subtotal() {
        return horas * precioHora;
    }

    public void cambiarHoras(int horas) {
        if (horas <= 0) {
            throw new IllegalArgumentException("Las horas deben ser mayores a 0");
        }
        this.horas = horas;
    }

    public void confirmar() {
        if (estado == EstadoReserva.CANCELADA) {
            throw new IllegalStateException("No se puede confirmar una reserva cancelada");
        }
        this.estado = EstadoReserva.CONFIRMADA;
    }

    public void cancelar() {
        this.estado = EstadoReserva.CANCELADA;
    }

    public String getJuegoId() {
        return juegoId;
    }

    public void setJuegoId(String juegoId) {
        this.juegoId = juegoId;
    }

    public LocalDate getFechaEvento() {
        return fechaEvento;
    }

    public void setFechaEvento(LocalDate fechaEvento) {
        this.fechaEvento = fechaEvento;
    }

    public int getHoras() {
        return horas;
    }

    public void setHoras(int horas) {
        this.horas = horas;
    }

    public int getPrecioHora() {
        return precioHora;
    }

    public void setPrecioHora(int precioHora) {
        this.precioHora = precioHora;
    }

    public EstadoReserva getEstado() {
        return estado;
    }

    public void setEstado(EstadoReserva estado) {
        this.estado = estado;
    }
}
