package juegaYa.Pagos.Dto;

import juegaYa.Pagos.Model.ComprobanteTransferencia;
import juegaYa.Pagos.Model.Pago;

import java.time.LocalDateTime;

public class PagoDTO {

    private int id;
    private int pedidoId;
    private int usuarioId;
    private int montoTotal;
    private String metodo;
    private String estado;
    private String referenciaExterna;
    private LocalDateTime fecha;
    private ComprobanteDTO comprobante;

    public static PagoDTO desde(Pago p) {
        PagoDTO dto = new PagoDTO();
        dto.id = p.getId();
        dto.pedidoId = p.getPedidoId();
        dto.usuarioId = p.getUsuarioId();
        dto.montoTotal = p.getMontoTotal();
        dto.metodo = p.getMetodo().name();
        dto.estado = p.getEstado().name();
        dto.referenciaExterna = p.getReferenciaExterna();
        dto.fecha = p.getFecha();
        dto.comprobante = p.getComprobante() != null ? ComprobanteDTO.desde(p.getComprobante()) : null;
        return dto;
    }

    public static class ComprobanteDTO {
        private int pagoId;
        private String banco;
        private String numeroOperacion;
        private String archivoUrl;
        private boolean verificado;

        public static ComprobanteDTO desde(ComprobanteTransferencia c) {
            ComprobanteDTO dto = new ComprobanteDTO();
            dto.pagoId = c.getPagoId();
            dto.banco = c.getBanco();
            dto.numeroOperacion = c.getNumeroOperacion();
            dto.archivoUrl = c.getArchivoUrl();
            dto.verificado = c.isVerificado();
            return dto;
        }

        public int getPagoId() { return pagoId; }
        public String getBanco() { return banco; }
        public String getNumeroOperacion() { return numeroOperacion; }
        public String getArchivoUrl() { return archivoUrl; }
        public boolean isVerificado() { return verificado; }
    }

    public int getId() { return id; }
    public int getPedidoId() { return pedidoId; }
    public int getUsuarioId() { return usuarioId; }
    public int getMontoTotal() { return montoTotal; }
    public String getMetodo() { return metodo; }
    public String getEstado() { return estado; }
    public String getReferenciaExterna() { return referenciaExterna; }
    public LocalDateTime getFecha() { return fecha; }
    public ComprobanteDTO getComprobante() { return comprobante; }
}
