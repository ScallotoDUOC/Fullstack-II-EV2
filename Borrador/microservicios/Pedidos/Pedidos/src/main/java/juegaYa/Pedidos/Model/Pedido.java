package juegaYa.Pedidos.Model;
import juegaYa.Pedidos.Exception.EstadoInvalidoException;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class Pedido {
    private int id;
    private String codigo;
    private int usuarioId;
    private EstadoPedido estado = EstadoPedido.BORRADOR;
    private int subtotal;
    private int transporte;
    private int descuento;
    private int total;

    private List<Reserva> items = new ArrayList<>();
    private DatosEntrega entrega;
    private Comuna comuna;
    private Descuento descuentoAplicado;

    public Pedido() {
    }

    public Pedido(int usuarioId) {
        this.usuarioId = usuarioId;
    }

    public void agregarItem(Reserva reserva) {
        if (estado != EstadoPedido.BORRADOR) {
            throw new EstadoInvalidoException("Solo se pueden agregar juegos a un pedido en borrador");
        }
        if (reserva == null || reserva.getJuegoId() == null || reserva.getJuegoId().isBlank()) {
            throw new IllegalArgumentException("El juego es obligatorio");
        }
        if (reserva.getHoras() <= 0 || reserva.getPrecioHora() <= 0) {
            throw new IllegalArgumentException("Las horas y el precio por hora deben ser mayores a 0");
        }
        items.add(reserva);
        calcularTotal();
    }

    public void quitarItem(String juegoId) {
        items.removeIf(r -> r.getJuegoId() != null && r.getJuegoId().equals(juegoId));
    }

    public int calcularTotal() {
        subtotal = items.stream().mapToInt(Reserva::subtotal).sum();
        transporte = (comuna != null) ? comuna.getTarifaTransporte() : 0;
        descuento = (descuentoAplicado != null) ? descuentoAplicado.aplicar(subtotal) : 0;
        total = subtotal + transporte - descuento;
        return total;
    }

    public void confirmar() {
        if (estado != EstadoPedido.BORRADOR) {
            throw new EstadoInvalidoException("Solo se puede confirmar un pedido en borrador");
        }
        if (items.isEmpty()) {
            throw new EstadoInvalidoException("El pedido no tiene items");
        }
        calcularTotal();
        if (codigo == null) {
            generarCodigo();
        }
        this.estado = EstadoPedido.PENDIENTE;
    }

    public void marcarPagado() {
        if (estado != EstadoPedido.PENDIENTE) {
            throw new EstadoInvalidoException("Solo se puede pagar un pedido pendiente");
        }
        this.estado = EstadoPedido.CONFIRMADO;
        items.forEach(Reserva::confirmar);
    }

    public void cancelar() {
        this.estado = EstadoPedido.CANCELADO;
        items.forEach(Reserva::cancelar);
    }

    public String generarCodigo() {
        this.codigo = "PED-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        return codigo;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }
    public String getCodigo() {
        return codigo;
    }
    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }
    public int getUsuarioId() {
        return usuarioId;
    }
    public void setUsuarioId(int usuarioId) {
        this.usuarioId = usuarioId;
    }
    public EstadoPedido getEstado() {
        return estado;
    }
    public void setEstado(EstadoPedido estado) {
        this.estado = estado;
    }

    public int getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(int subtotal) {
        this.subtotal = subtotal;
    }

    public int getTransporte() {
        return transporte;
    }

    public void setTransporte(int transporte) {
        this.transporte = transporte;
    }

    public int getDescuento() {
        return descuento;
    }

    public void setDescuento(int descuento) {
        this.descuento = descuento;
    }

    public int getTotal() {
        return total;
    }
    public void setTotal(int total) {
        this.total = total;
    }
    public List<Reserva> getItems() {
        return items;
    }
    public void setItems(List<Reserva> items) {
        this.items = items;
    }

    public DatosEntrega getEntrega() {
        return entrega;
    }

    public void setEntrega(DatosEntrega entrega) {
        this.entrega = entrega;
    }
    public Comuna getComuna() {
        return comuna;
    }
    public void setComuna(Comuna comuna) {
        this.comuna = comuna;
    }
    public Descuento getDescuentoAplicado() {
        return descuentoAplicado;
    }

    public void setDescuentoAplicado(Descuento descuentoAplicado) {
        this.descuentoAplicado = descuentoAplicado;
    }
}
