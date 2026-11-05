package juegaYa.Pagos.Exception;

public class PagoNoEncontradoException extends RuntimeException {

    private PagoNoEncontradoException(String mensaje) {
        super(mensaje);
    }

    public static PagoNoEncontradoException porId(int pagoId) {
        return new PagoNoEncontradoException("Pago no encontrado: " + pagoId);
    }

    public static PagoNoEncontradoException porPedido(int pedidoId) {
        return new PagoNoEncontradoException("No hay pago para el pedido: " + pedidoId);
    }
}
