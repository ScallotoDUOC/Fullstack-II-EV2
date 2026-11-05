package juegaYa.Pedidos.Repository;

import juegaYa.Pedidos.Model.Pedido;
import juegaYa.Pedidos.Model.Reserva;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Repositorio en memoria. Para usar una base de datos real, reemplaza
 * la implementacion manteniendo la misma API.
 */
public class PedidoRepository {

    private final Map<Integer, Pedido> pedidos = new LinkedHashMap<>();
    private final List<Reserva> reservas = new ArrayList<>();
    private int siguienteId = 1;

    public boolean guardar(Pedido pedido) {
        if (pedido == null) {
            return false;
        }
        if (pedido.getId() == 0) {
            pedido.setId(siguienteId++);
        }
        pedidos.put(pedido.getId(), pedido);
        return true;
    }

    public boolean guardar(Reserva reserva) {
        if (reserva == null) {
            return false;
        }
        if (!reservas.contains(reserva)) {
            reservas.add(reserva);
        }
        return true;
    }

    public Optional<Pedido> buscarPorId(int id) {
        return Optional.ofNullable(pedidos.get(id));
    }

    public List<Pedido> buscarPorUsuario(int usuarioId) {
        return pedidos.values().stream()
                .filter(p -> p.getUsuarioId() == usuarioId)
                .collect(Collectors.toList());
    }

    /**
     * Pedidos que tienen al menos una reserva con evento en la fecha indicada.
     */
    public List<Pedido> buscarPorFecha(LocalDate fecha) {
        return pedidos.values().stream()
                .filter(p -> p.getItems().stream()
                        .anyMatch(r -> fecha.equals(r.getFechaEvento())))
                .collect(Collectors.toList());
    }
}
