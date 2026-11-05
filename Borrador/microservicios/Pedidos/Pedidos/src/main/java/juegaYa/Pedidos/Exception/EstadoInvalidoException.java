package juegaYa.Pedidos.Exception;

/** Se lanza cuando una operacion no es valida para el estado actual del pedido o la reserva. */
public class EstadoInvalidoException extends RuntimeException {

    public EstadoInvalidoException(String mensaje) {
        super(mensaje);
    }
}
