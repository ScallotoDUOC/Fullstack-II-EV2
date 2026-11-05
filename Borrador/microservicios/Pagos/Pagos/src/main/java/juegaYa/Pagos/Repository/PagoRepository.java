package juegaYa.Pagos.Repository;

import juegaYa.Pagos.Model.Pago;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Repositorio en memoria. Para usar una base de datos real, reemplaza
 * la implementacion manteniendo la misma API.
 */
public class PagoRepository {

    private final Map<Integer, Pago> pagos = new ConcurrentHashMap<>();
    /** Ultimo pago registrado de cada pedido. */
    private final Map<Integer, Integer> ultimoPagoPorPedido = new ConcurrentHashMap<>();
    private final AtomicInteger siguienteId = new AtomicInteger(1);

    public boolean guardar(Pago pago) {
        if (pago == null) {
            return false;
        }
        if (pago.getId() == 0) {
            pago.setId(siguienteId.getAndIncrement());
        }
        pagos.put(pago.getId(), pago);
        ultimoPagoPorPedido.put(pago.getPedidoId(), pago.getId());
        return true;
    }

    public Optional<Pago> buscarPorId(int id) {
        return Optional.ofNullable(pagos.get(id));
    }

    public Optional<Pago> buscarPorPedido(int pedidoId) {
        Integer id = ultimoPagoPorPedido.get(pedidoId);
        return id == null ? Optional.empty() : buscarPorId(id);
    }
}
