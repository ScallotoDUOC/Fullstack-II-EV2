package juegaYa.Pedidos.Exception;

public class PedidoNoEncontradoException extends RuntimeException {

    public PedidoNoEncontradoException(int pedidoId) {
        super("Pedido no encontrado: " + pedidoId);
    }
}
