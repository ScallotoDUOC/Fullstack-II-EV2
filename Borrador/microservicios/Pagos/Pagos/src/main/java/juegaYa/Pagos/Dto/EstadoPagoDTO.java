package juegaYa.Pagos.Dto;

import juegaYa.Pagos.Model.EstadoPago;
import juegaYa.Pagos.Model.Pago;

public class EstadoPagoDTO {

    private final int pedidoId;
    private final String estado;
    private final int pagoId; // 0 si no se conoce

    public EstadoPagoDTO(int pedidoId, EstadoPago estado) {
        this.pedidoId = pedidoId;
        this.estado = estado.name();
        this.pagoId = 0;
    }

    /** Incluye el id del pago, para poder confirmarlo o reembolsarlo después. */
    public EstadoPagoDTO(Pago pago) {
        this.pedidoId = pago.getPedidoId();
        this.estado = pago.getEstado().name();
        this.pagoId = pago.getId();
    }

    public int getPedidoId() { return pedidoId; }
    public String getEstado() { return estado; }
    public int getPagoId() { return pagoId; }
}
