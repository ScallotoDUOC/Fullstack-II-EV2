package juegaYa.Pagos.Model;

import juegaYa.Pagos.Exception.EstadoPagoInvalidoException;

import java.time.LocalDateTime;

public class Pago {

    private int id;
    private int pedidoId;
    private int usuarioId;
    private int montoTotal;
    private MetodoPago metodo;
    private EstadoPago estado = EstadoPago.PENDIENTE;
    private String referenciaExterna;
    private LocalDateTime fecha = LocalDateTime.now();

    private ComprobanteTransferencia comprobante;

    public Pago() {
    }

    public Pago(int pedidoId, int usuarioId, int montoTotal, MetodoPago metodo) {
        this.pedidoId = pedidoId;
        this.usuarioId = usuarioId;
        this.montoTotal = montoTotal;
        this.metodo = metodo;
    }

    public void aprobar() {
        exigirPendiente("aprobar");
        this.estado = EstadoPago.APROBADO;
    }

    public void rechazar(String motivo) {
        if (motivo == null || motivo.isBlank()) {
            throw new IllegalArgumentException("Debe indicar el motivo del rechazo");
        }
        exigirPendiente("rechazar");
        this.estado = EstadoPago.RECHAZADO;
    }

    public void reembolsar() {
        if (estado != EstadoPago.APROBADO) {
            throw new EstadoPagoInvalidoException("Solo se puede reembolsar un pago aprobado");
        }
        this.estado = EstadoPago.REEMBOLSADO;
    }

    private void exigirPendiente(String accion) {
        if (estado != EstadoPago.PENDIENTE) {
            throw new EstadoPagoInvalidoException(
                    "No se puede " + accion + " un pago en estado " + estado);
        }
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public int getPedidoId() {
        return pedidoId;
    }

    public void setPedidoId(int pedidoId) {
        this.pedidoId = pedidoId;
    }

    public int getUsuarioId() {
        return usuarioId;
    }

    public void setUsuarioId(int usuarioId) {
        this.usuarioId = usuarioId;
    }

    public int getMontoTotal() {
        return montoTotal;
    }

    public void setMontoTotal(int montoTotal) {
        this.montoTotal = montoTotal;
    }

    public MetodoPago getMetodo() {
        return metodo;
    }

    public void setMetodo(MetodoPago metodo) {
        this.metodo = metodo;
    }

    public EstadoPago getEstado() {
        return estado;
    }

    public void setEstado(EstadoPago estado) {
        this.estado = estado;
    }

    public String getReferenciaExterna() {
        return referenciaExterna;
    }

    public void setReferenciaExterna(String referenciaExterna) {
        this.referenciaExterna = referenciaExterna;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public void setFecha(LocalDateTime fecha) {
        this.fecha = fecha;
    }

    public ComprobanteTransferencia getComprobante() {
        return comprobante;
    }

    public void setComprobante(ComprobanteTransferencia comprobante) {
        this.comprobante = comprobante;
    }
}
