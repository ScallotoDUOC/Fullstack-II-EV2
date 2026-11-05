package juegaYa.Pedidos.Controller;

import juegaYa.Pedidos.Dto.PedidoDTO;
import juegaYa.Pedidos.Service.PedidoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/pedidos")
public class PedidoController {

    private final PedidoService service;

    public PedidoController(PedidoService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<PedidoDTO> crearBorrador(@RequestParam int usuarioId) {
        PedidoDTO dto = PedidoDTO.desde(service.crearBorrador(usuarioId));
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @GetMapping
    public List<PedidoDTO> listarPorUsuario(@RequestParam int usuarioId) {
        return service.listarPorUsuario(usuarioId).stream()
                .map(PedidoDTO::desde)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public PedidoDTO obtener(@PathVariable int id) {
        return PedidoDTO.desde(service.buscar(id));
    }

    @PostMapping("/{id}/items")
    public ResponseEntity<PedidoDTO> agregarItem(@PathVariable int id, @RequestBody PedidoDTO.ItemRequest item) {
        PedidoDTO dto = PedidoDTO.desde(service.agregarItem(id, item.aModelo()));
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @PutMapping("/{id}/confirmar")
    public PedidoDTO confirmar(@PathVariable int id, @RequestBody PedidoDTO.EntregaDTO entrega) {
        return PedidoDTO.desde(service.confirmar(id, entrega.aModelo()));
    }

    @PutMapping("/{id}/pagado")
    public PedidoDTO pagado(@PathVariable int id) {
        return PedidoDTO.desde(service.pagado(id));
    }

    @PutMapping("/{id}/cancelar")
    public PedidoDTO cancelar(@PathVariable int id) {
        return PedidoDTO.desde(service.cancelar(id));
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<String> noEncontrado(NoSuchElementException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<String> estadoInvalido(IllegalStateException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
    }
}
