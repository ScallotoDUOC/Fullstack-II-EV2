package juegaYa.Pagos.Dto;

import juegaYa.Pagos.Model.MetodoPago;

public class IniciarPagoRequest {

    private int pedidoId;
    private int usuarioId;
    private int montoTotal;
    private MetodoPago metodo;

    public int getPedidoId() { return pedidoId; }
    public void setPedidoId(int pedidoId) { this.pedidoId = pedidoId; }
    public int getUsuarioId() { return usuarioId; }
    public void setUsuarioId(int usuarioId) { this.usuarioId = usuarioId; }
    public int getMontoTotal() { return montoTotal; }
    public void setMontoTotal(int montoTotal) { this.montoTotal = montoTotal; }
    public MetodoPago getMetodo() { return metodo; }
    public void setMetodo(MetodoPago metodo) { this.metodo = metodo; }
}
