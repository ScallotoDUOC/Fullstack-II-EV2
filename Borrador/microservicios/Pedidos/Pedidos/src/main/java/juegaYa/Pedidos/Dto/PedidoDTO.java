package juegaYa.Pedidos.Dto;

import juegaYa.Pedidos.Model.DatosEntrega;
import juegaYa.Pedidos.Model.Pedido;
import juegaYa.Pedidos.Model.Reserva;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

public class PedidoDTO {

    private int id;
    private String codigo;
    private int usuarioId;
    private String estado;
    private int subtotal;
    private int transporte;
    private int descuento;
    private int total;
    private String comuna;
    private EntregaDTO entrega;
    private List<ItemDTO> items;

    public static PedidoDTO desde(Pedido p) {
        PedidoDTO dto = new PedidoDTO();
        dto.id = p.getId();
        dto.codigo = p.getCodigo();
        dto.usuarioId = p.getUsuarioId();
        dto.estado = p.getEstado().name();
        dto.subtotal = p.getSubtotal();
        dto.transporte = p.getTransporte();
        dto.descuento = p.getDescuento();
        dto.total = p.getTotal();
        dto.comuna = p.getComuna() != null ? p.getComuna().getNombre() : null;
        dto.entrega = p.getEntrega() != null ? EntregaDTO.desde(p.getEntrega()) : null;
        dto.items = p.getItems().stream().map(ItemDTO::desde).collect(Collectors.toList());
        return dto;
    }

    /** Datos de entrega: se usa tanto en la peticion de confirmar como en la respuesta. */
    public static class EntregaDTO {
        private String nombre;
        private String telefono;
        private String direccion;
        private String indicaciones;

        public static EntregaDTO desde(DatosEntrega e) {
            EntregaDTO dto = new EntregaDTO();
            dto.nombre = e.getNombre();
            dto.telefono = e.getTelefono();
            dto.direccion = e.getDireccion();
            dto.indicaciones = e.getIndicaciones();
            return dto;
        }

        public DatosEntrega aModelo() {
            return new DatosEntrega(nombre, telefono, direccion, indicaciones);
        }

        public String getNombre() { return nombre; }
        public void setNombre(String nombre) { this.nombre = nombre; }
        public String getTelefono() { return telefono; }
        public void setTelefono(String telefono) { this.telefono = telefono; }
        public String getDireccion() { return direccion; }
        public void setDireccion(String direccion) { this.direccion = direccion; }
        public String getIndicaciones() { return indicaciones; }
        public void setIndicaciones(String indicaciones) { this.indicaciones = indicaciones; }
    }

    /** Cuerpo de POST /pedidos/{id}/items: un juego, la fecha del evento y las horas. */
    public static class ItemRequest {
        private String juegoId;
        private LocalDate fechaEvento;
        private int horas;
        private int precioHora;

        public Reserva aModelo() {
            return new Reserva(juegoId, fechaEvento, horas, precioHora);
        }

        public String getJuegoId() { return juegoId; }
        public void setJuegoId(String juegoId) { this.juegoId = juegoId; }
        public LocalDate getFechaEvento() { return fechaEvento; }
        public void setFechaEvento(LocalDate fechaEvento) { this.fechaEvento = fechaEvento; }
        public int getHoras() { return horas; }
        public void setHoras(int horas) { this.horas = horas; }
        public int getPrecioHora() { return precioHora; }
        public void setPrecioHora(int precioHora) { this.precioHora = precioHora; }
    }

    public static class ItemDTO {
        private String juegoId;
        private LocalDate fechaEvento;
        private int horas;
        private int precioHora;
        private int subtotal;
        private String estado;

        public static ItemDTO desde(Reserva r) {
            ItemDTO dto = new ItemDTO();
            dto.juegoId = r.getJuegoId();
            dto.fechaEvento = r.getFechaEvento();
            dto.horas = r.getHoras();
            dto.precioHora = r.getPrecioHora();
            dto.subtotal = r.subtotal();
            dto.estado = r.getEstado().name();
            return dto;
        }

        public String getJuegoId() { return juegoId; }
        public LocalDate getFechaEvento() { return fechaEvento; }
        public int getHoras() { return horas; }
        public int getPrecioHora() { return precioHora; }
        public int getSubtotal() { return subtotal; }
        public String getEstado() { return estado; }
    }

    public int getId() { return id; }
    public String getCodigo() { return codigo; }
    public int getUsuarioId() { return usuarioId; }
    public String getEstado() { return estado; }
    public int getSubtotal() { return subtotal; }
    public int getTransporte() { return transporte; }
    public int getDescuento() { return descuento; }
    public int getTotal() { return total; }
    public String getComuna() { return comuna; }
    public EntregaDTO getEntrega() { return entrega; }
    public List<ItemDTO> getItems() { return items; }
}
