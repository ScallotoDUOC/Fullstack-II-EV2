package juegaYa.Pagos.Controller;

import juegaYa.Pagos.Dto.ComprobanteRequest;
import juegaYa.Pagos.Dto.EstadoPagoDTO;
import juegaYa.Pagos.Dto.IniciarPagoRequest;
import juegaYa.Pagos.Dto.PagoDTO;
import juegaYa.Pagos.Service.PagoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/pagos")
public class PagoController {

    private final PagoService service;

    public PagoController(PagoService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<PagoDTO> iniciarPago(@RequestBody IniciarPagoRequest request) {
        PagoDTO dto = PagoDTO.desde(service.iniciarPago(
                request.getPedidoId(), request.getUsuarioId(),
                request.getMontoTotal(), request.getMetodo()));
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @PostMapping("/{id}/comprobante")
    public ResponseEntity<PagoDTO.ComprobanteDTO> registrarComprobante(
            @PathVariable int id, @RequestBody ComprobanteRequest request) {
        PagoDTO.ComprobanteDTO dto = PagoDTO.ComprobanteDTO.desde(
                service.registrarComprobante(id, request.aModelo()));
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @PutMapping("/{id}/confirmar")
    public PagoDTO confirmarPago(@PathVariable int id) {
        return PagoDTO.desde(service.confirmarPago(id));
    }

    @PutMapping("/{id}/reembolsar")
    public PagoDTO reembolsar(@PathVariable int id) {
        return PagoDTO.desde(service.reembolsar(id));
    }

    @GetMapping("/pedido/{pedidoId}/estado")
    public EstadoPagoDTO estadoDe(@PathVariable int pedidoId) {
        return new EstadoPagoDTO(service.pagoDe(pedidoId));
    }
}
