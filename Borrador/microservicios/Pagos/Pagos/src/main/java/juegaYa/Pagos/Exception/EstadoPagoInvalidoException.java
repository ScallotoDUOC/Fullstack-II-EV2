package juegaYa.Pagos.Exception;

/** Se lanza cuando una operacion no es valida para el estado actual del pago. */
public class EstadoPagoInvalidoException extends RuntimeException {

    public EstadoPagoInvalidoException(String mensaje) {
        super(mensaje);
    }
}
