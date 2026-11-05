package juegaYa.Usuarios.Service;

import juegaYa.Usuarios.Exception.AutenticacionException;
import juegaYa.Usuarios.Exception.EmailYaRegistradoException;
import juegaYa.Usuarios.Model.Rol;
import juegaYa.Usuarios.Model.Sesion;
import juegaYa.Usuarios.Model.Usuario;
import juegaYa.Usuarios.Repository.SesionRepository;
import juegaYa.Usuarios.Repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.Locale;

/**
 * Registro, inicio/cierre de sesión y validación de tokens. Igual que en
 * Catalogo, además del UsuarioRepository del diagrama se usa un SesionRepository
 * para poder guardar y consultar las sesiones.
 */
@Service
public class AuthService {

    private static final Duration DURACION_SESION = Duration.ofHours(8);
    private static final int LARGO_MINIMO_PASSWORD = 6;

    private final UsuarioRepository usuarioRepository;
    private final SesionRepository sesionRepository;

    public AuthService(UsuarioRepository usuarioRepository, SesionRepository sesionRepository) {
        this.usuarioRepository = usuarioRepository;
        this.sesionRepository = sesionRepository;
    }

    /**
     * Crea una cuenta nueva con rol CLIENTE (los administradores no se crean por
     * acá). La contraseña se guarda hasheada, nunca en texto plano.
     */
    @Transactional
    public Usuario registrar(String nombre, String email, String password) {
        if (nombre == null || nombre.isBlank()) {
            throw new IllegalArgumentException("El nombre es obligatorio");
        }
        if (email == null || email.isBlank() || !email.contains("@")) {
            throw new IllegalArgumentException("El email no es válido");
        }
        if (password == null || password.length() < LARGO_MINIMO_PASSWORD) {
            throw new IllegalArgumentException(
                    "La contraseña debe tener al menos " + LARGO_MINIMO_PASSWORD + " caracteres");
        }
        String emailNormalizado = normalizar(email);
        if (usuarioRepository.existsByEmail(emailNormalizado)) {
            throw new EmailYaRegistradoException(emailNormalizado);
        }
        Usuario usuario = new Usuario(nombre.trim(), emailNormalizado, Usuario.hashearPassword(password), Rol.CLIENTE);
        return usuarioRepository.save(usuario);
    }

    /**
     * Abre una sesión si el email y la contraseña coinciden y la cuenta está activa.
     * Ante cualquier falla responde lo mismo, para no filtrar qué parte falló.
     */
    @Transactional
    public Sesion iniciarSesion(String email, String password) {
        Usuario usuario = (email == null) ? null
                : usuarioRepository.findByEmail(normalizar(email)).orElse(null);
        if (usuario == null || !usuario.isActivo() || !usuario.verificarPassword(password)) {
            throw new AutenticacionException("Email o contraseña incorrectos");
        }
        return sesionRepository.save(Sesion.abrir(usuario.getId(), DURACION_SESION));
    }

    /** Cierra la sesión asociada al token. Lanza AutenticacionException si el token no existe. */
    @Transactional
    public void cerrarSesion(String token) {
        Sesion sesion = buscarSesion(token);
        sesion.cerrar();
        sesionRepository.save(sesion);
    }

    /** Devuelve el usuario dueño del token, siempre que la sesión siga vigente y la cuenta activa. */
    @Transactional(readOnly = true)
    public Usuario validarToken(String token) {
        Sesion sesion = buscarSesion(token);
        if (!sesion.estaVigente()) {
            throw new AutenticacionException("La sesión expiró o fue cerrada");
        }
        return usuarioRepository.findById(sesion.getUsuarioId())
                .filter(Usuario::isActivo)
                .orElseThrow(() -> new AutenticacionException("La cuenta ya no está disponible"));
    }

    private Sesion buscarSesion(String token) {
        if (token == null || token.isBlank()) {
            throw new AutenticacionException("Falta el token de sesión");
        }
        return sesionRepository.findById(token)
                .orElseThrow(() -> new AutenticacionException("Token de sesión inválido"));
    }

    private String normalizar(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
