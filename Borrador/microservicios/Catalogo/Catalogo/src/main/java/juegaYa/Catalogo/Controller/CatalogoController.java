package juegaYa.Catalogo.Controller;

import jakarta.validation.Valid;
import juegaYa.Catalogo.Dto.JuegoDatos;
import juegaYa.Catalogo.Dto.RangoPrecio;
import juegaYa.Catalogo.Dto.ResenaDto;
import juegaYa.Catalogo.Model.BloqueoFecha;
import juegaYa.Catalogo.Model.Categoria;
import juegaYa.Catalogo.Model.Juego;
import juegaYa.Catalogo.Model.Resena;
import juegaYa.Catalogo.Service.CatalogoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/**
 * Expone el catálogo por HTTP. Es básicamente un traductor: toma lo que llega
 * por la URL/body y se lo pasa tal cual al CatalogoService, que es donde está
 * la lógica de verdad. Los errores (recurso no encontrado, datos inválidos,
 * etc.) no se manejan acá: los agarra el GlobalExceptionHandler.
 */
@RestController
@RequestMapping("/api/catalogo")
public class CatalogoController {

    private final CatalogoService catalogoService;

    public CatalogoController(CatalogoService catalogoService) {
        this.catalogoService = catalogoService;
    }

    /** GET /api/catalogo?categoria=INFLABLE&texto=cast&precioMin=10000&precioMax=90000 */
    @GetMapping
    public List<Juego> listar(
            @RequestParam(required = false) Categoria categoria,
            @RequestParam(required = false) String texto,
            @RequestParam(required = false) Integer precioMin,
            @RequestParam(required = false) Integer precioMax
    ) {
        RangoPrecio rango = (precioMin == null && precioMax == null) ? null : new RangoPrecio(precioMin, precioMax);
        return catalogoService.listar(categoria, texto, rango);
    }

    /** GET /api/catalogo/disponibles?fecha=2026-10-20 */
    @GetMapping("/disponibles")
    public List<Juego> juegosDisponibles(@RequestParam LocalDate fecha) {
        return catalogoService.juegosDisponibles(fecha);
    }

    /** GET /api/catalogo/{id} */
    @GetMapping("/{id}")
    public Juego obtener(@PathVariable String id) {
        return catalogoService.obtener(id);
    }

    /** POST /api/catalogo */
    @PostMapping
    public ResponseEntity<Juego> crear(@Valid @RequestBody JuegoDatos datos) {
        Juego creado = catalogoService.crear(datos);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    /** PUT /api/catalogo/{id} */
    @PutMapping("/{id}")
    public Juego editar(@PathVariable String id, @Valid @RequestBody JuegoDatos datos) {
        return catalogoService.editar(id, datos);
    }

    /** DELETE /api/catalogo/{id} */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable String id) {
        boolean eliminado = catalogoService.eliminar(id);
        return eliminado ? ResponseEntity.noContent().build() : ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }

    /** POST /api/catalogo/{id}/resenas */
    @PostMapping("/{id}/resenas")
    public ResponseEntity<Resena> agregarResena(@PathVariable String id, @Valid @RequestBody ResenaDto dto) {
        LocalDate fecha = (dto.fecha() != null) ? dto.fecha() : LocalDate.now();
        Resena resena = new Resena(id, dto.usuarioId(), dto.autor(), dto.estrellas(), dto.comentario(), fecha);
        Resena creada = catalogoService.agregarResena(id, resena);
        return ResponseEntity.status(HttpStatus.CREATED).body(creada);
    }

    /** POST /api/catalogo/{id}/bloqueos?fecha=2026-10-20&reservaId=123 (reservaId es opcional: sin él, el bloqueo queda como MANUAL) */
    @PostMapping("/{id}/bloqueos")
    public ResponseEntity<BloqueoFecha> bloquear(
            @PathVariable String id,
            @RequestParam LocalDate fecha,
            @RequestParam(required = false) Integer reservaId
    ) {
        BloqueoFecha creado = catalogoService.bloquear(id, fecha, reservaId);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    /** DELETE /api/catalogo/{id}/bloqueos?fecha=2026-10-20 - quita el bloqueo manual de ese juego en esa fecha. */
    @DeleteMapping("/{id}/bloqueos")
    public ResponseEntity<Void> desbloquear(@PathVariable String id, @RequestParam LocalDate fecha) {
        catalogoService.desbloquearFecha(id, fecha);
        return ResponseEntity.noContent().build();
    }

    /** DELETE /api/catalogo/bloqueos/reserva/{reservaId} - libera todos los bloqueos de esa reserva. */
    @DeleteMapping("/bloqueos/reserva/{reservaId}")
    public ResponseEntity<Void> liberar(@PathVariable Integer reservaId) {
        catalogoService.liberar(reservaId);
        return ResponseEntity.noContent().build();
    }
}
