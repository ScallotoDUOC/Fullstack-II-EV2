package juegaYa.Pedidos.Service;

import juegaYa.Pedidos.Model.Reserva;

import juegaYa.Pedidos.Model.DatosEntrega;
import juegaYa.Pedidos.Model.Pedido;
import juegaYa.Pedidos.Repository.PedidoRepository;

import java.util.List;
import java.util.NoSuchElementException;

public class PedidoService {

    private final PedidoRepository repository;

    public PedidoService(PedidoRepository repository) {
        this.repository = repository;
    }

    public Pedido crearBorrador(int usuarioId) {
        Pedido pedido = new Pedido(usuarioId);
        repository.guardar(pedido);
        return pedido;
    }

    public Pedido agregarItem(int pedidoId, Reserva reserva) {
        Pedido pedido = obtener(pedidoId);
        pedido.agregarItem(reserva);
        guardar(pedido);
        return pedido;
    }

    public Pedido buscar(int pedidoId) {
        return obtener(pedidoId);
    }

    public Pedido confirmar(int pedidoId, DatosEntrega entrega) {
        Pedido pedido = obtener(pedidoId);
        pedido.setEntrega(entrega);
        pedido.confirmar();
        guardar(pedido);
        return pedido;
    }

    public Pedido pagado(int pedidoId) {
        Pedido pedido = obtener(pedidoId);
        pedido.marcarPagado();
        guardar(pedido);
        return pedido;
    }

    public Pedido cancelar(int pedidoId) {
        Pedido pedido = obtener(pedidoId);
        pedido.cancelar();
        guardar(pedido);
        return pedido;
    }

    public List<Pedido> listarPorUsuario(int usuarioId) {
        return repository.buscarPorUsuario(usuarioId);
    }

    private Pedido obtener(int pedidoId) {
        return repository.buscarPorId(pedidoId)
                .orElseThrow(() -> new NoSuchElementException("Pedido no encontrado: " + pedidoId));
    }

    private void guardar(Pedido pedido) {
        if (!repository.guardar(pedido)) {
            throw new IllegalStateException("No se pudo guardar el pedido " + pedido.getId());
        }
    }
}
