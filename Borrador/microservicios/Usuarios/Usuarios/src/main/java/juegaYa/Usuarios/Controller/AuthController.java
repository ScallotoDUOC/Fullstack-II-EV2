package juegaYa.Usuarios.Controller;

import jakarta.validation.Valid;
import juegaYa.Usuarios.Dto.LoginDto;
import juegaYa.Usuarios.Dto.LoginResponse;
import juegaYa.Usuarios.Dto.PerfilDto;
import juegaYa.Usuarios.Dto.RegistroDto;
import juegaYa.Usuarios.Dto.UsuarioResponse;
import juegaYa.Usuarios.Exception.AutenticacionException;
import juegaYa.Usuarios.Model.Sesion;
import juegaYa.Usuarios.Model.Usuario;
import juegaYa.Usuarios.Service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Expone el registro y el login por HTTP. Igual que el controller del catálogo,
 * solo traduce request/response y delega todo al AuthService; los errores los
 * convierte el GlobalExceptionHandler. Nunca se devuelve la entidad Usuario
 * directo (traería el hash de la contraseña), siempre un UsuarioResponse.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final String PREFIJO_BEARER = "Bearer ";

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /** POST /api/auth/registro -> 201 con el usuario creado. */
    @PostMapping("/registro")
    public ResponseEntity<UsuarioResponse> registrar(@Valid @RequestBody RegistroDto dto) {
        Usuario creado = authService.registrar(dto.nombre(), dto.email(), dto.password(), dto.rut());
        return ResponseEntity.status(HttpStatus.CREATED).body(UsuarioResponse.de(creado));
    }

    /** POST /api/auth/login -> token de sesión + datos del usuario. */
    @PostMapping("/login")
    public LoginResponse iniciarSesion(@Valid @RequestBody LoginDto dto) {
        Sesion sesion = authService.iniciarSesion(dto.email(), dto.password());
        String jwt = authService.emitirJwt(sesion);
        Usuario usuario = authService.validarToken(jwt);
        return LoginResponse.de(jwt, sesion, usuario);
    }

    /** POST /api/auth/logout con "Authorization: Bearer <token>" -> 204. */
    @PostMapping("/logout")
    public ResponseEntity<Void> cerrarSesion(@RequestHeader(value = "Authorization", required = false) String authorization) {
        authService.cerrarSesion(extraerToken(authorization));
        return ResponseEntity.noContent().build();
    }

    /** GET /api/auth/me con "Authorization: Bearer <token>" -> el usuario dueño del token. */
    @GetMapping("/me")
    public UsuarioResponse yo(@RequestHeader(value = "Authorization", required = false) String authorization) {
        return UsuarioResponse.de(authService.validarToken(extraerToken(authorization)));
    }

    /** PUT /api/auth/me: el dueño del token edita su nombre, teléfono y dirección (y el RUT si aún no tenía). */
    @PutMapping("/me")
    public UsuarioResponse actualizarPerfil(@RequestHeader(value = "Authorization", required = false) String authorization,
                                            @Valid @RequestBody PerfilDto dto) {
        return UsuarioResponse.de(authService.actualizarPerfil(extraerToken(authorization),
                dto.nombre(), dto.telefono(), dto.direccion(), dto.rut()));
    }

    /** GET /api/auth/usuarios: lista de usuarios (nombre, RUT, etc.). Solo administradores. */
    @GetMapping("/usuarios")
    public List<UsuarioResponse> usuarios(@RequestHeader(value = "Authorization", required = false) String authorization) {
        return authService.listarUsuarios(extraerToken(authorization)).stream().map(UsuarioResponse::de).toList();
    }

    /** GET /api/auth/favoritos: ids de los juegos favoritos del usuario del token. */
    @GetMapping("/favoritos")
    public List<String> favoritos(@RequestHeader(value = "Authorization", required = false) String authorization) {
        return authService.listarFavoritos(extraerToken(authorization));
    }

    /** PUT /api/auth/favoritos/{juegoId}: marca el juego como favorito (idempotente) -> 204. */
    @PutMapping("/favoritos/{juegoId}")
    public ResponseEntity<Void> agregarFavorito(@RequestHeader(value = "Authorization", required = false) String authorization,
                                                @PathVariable String juegoId) {
        authService.agregarFavorito(extraerToken(authorization), juegoId);
        return ResponseEntity.noContent().build();
    }

    /** DELETE /api/auth/favoritos/{juegoId}: quita el juego de los favoritos -> 204. */
    @DeleteMapping("/favoritos/{juegoId}")
    public ResponseEntity<Void> quitarFavorito(@RequestHeader(value = "Authorization", required = false) String authorization,
                                               @PathVariable String juegoId) {
        authService.quitarFavorito(extraerToken(authorization), juegoId);
        return ResponseEntity.noContent().build();
    }

    /** Saca el token del header "Bearer xxx". Si falta o viene mal formado, es un 401. */
    private String extraerToken(String authorization) {
        if (authorization == null || !authorization.startsWith(PREFIJO_BEARER)) {
            throw new AutenticacionException("Falta el header Authorization: Bearer <token>");
        }
        return authorization.substring(PREFIJO_BEARER.length()).trim();
    }
}
