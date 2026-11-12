package juegaYa.Usuarios.Service;

import juegaYa.Usuarios.Exception.AutenticacionException;
import juegaYa.Usuarios.Exception.EmailYaRegistradoException;
import juegaYa.Usuarios.Exception.RutYaRegistradoException;
import juegaYa.Usuarios.Model.Rol;
import juegaYa.Usuarios.Model.Sesion;
import juegaYa.Usuarios.Model.Usuario;
import juegaYa.Usuarios.Model.Favorito;
import juegaYa.Usuarios.Repository.FavoritoRepository;
import juegaYa.Usuarios.Repository.SesionRepository;
import juegaYa.Usuarios.Repository.UsuarioRepository;
import juegaYa.Usuarios.Security.JwtUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.List;
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
    private final FavoritoRepository favoritoRepository;
    private final JwtUtil jwtUtil;

    public AuthService(UsuarioRepository usuarioRepository, SesionRepository sesionRepository,
                       FavoritoRepository favoritoRepository, JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
        this.usuarioRepository = usuarioRepository;
        this.sesionRepository = sesionRepository;
        this.favoritoRepository = favoritoRepository;
    }

    /**
     * Crea una cuenta nueva con rol CLIENTE (los administradores no se crean por
     * acá). La contraseña se guarda hasheada, nunca en texto plano.
     */
    @Transactional
    public Usuario registrar(String nombre, String email, String password, String rut) {
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
        String rutNormalizado = normalizarRut(rut);
        String emailNormalizado = normalizar(email);
        if (usuarioRepository.existsByEmail(emailNormalizado)) {
            throw new EmailYaRegistradoException(emailNormalizado);
        }
        if (usuarioRepository.existsByRut(rutNormalizado)) {
            throw new RutYaRegistradoException(rutNormalizado);
        }
        Usuario usuario = new Usuario(nombre.trim(), emailNormalizado, Usuario.hashearPassword(password), Rol.CLIENTE);
        usuario.setRut(rutNormalizado);
        return usuarioRepository.save(usuario);
    }

    /**
     * Cambia el nombre, teléfono y dirección del dueño del token. El RUT solo se
     * puede fijar si la cuenta aún no tiene uno; si ya lo tiene, se ignora lo que llegue.
     */
    @Transactional
    public Usuario actualizarPerfil(String token, String nombre, String telefono, String direccion, String rut) {
        Usuario usuario = validarToken(token);
        if (nombre == null || nombre.isBlank()) {
            throw new IllegalArgumentException("El nombre es obligatorio");
        }
        usuario.setNombre(nombre.trim());
        usuario.setTelefono(limpiar(telefono));
        usuario.setDireccion(limpiar(direccion));
        if (usuario.getRut() == null && rut != null && !rut.isBlank()) {
            String rutNormalizado = normalizarRut(rut);
            if (usuarioRepository.existsByRut(rutNormalizado)) {
                throw new RutYaRegistradoException(rutNormalizado);
            }
            usuario.setRut(rutNormalizado);
        }
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

    /**
     * Emite el JWT de una sesión recién abierta: sub = id del usuario, rol, jti = token de la sesión
     * (así al cerrar sesión se puede revocar) y exp = vencimiento de la sesión.
     */
    @Transactional(readOnly = true)
    public String emitirJwt(Sesion sesion) {
        Usuario usuario = usuarioRepository.findById(sesion.getUsuarioId())
                .orElseThrow(() -> new AutenticacionException("La cuenta ya no está disponible"));
        long iat = java.time.Instant.now().getEpochSecond();
        long exp = sesion.getExpiraEn().atZone(java.time.ZoneId.systemDefault()).toEpochSecond();
        return jwtUtil.generar(String.valueOf(usuario.getId()), usuario.getRol().name(), sesion.getToken(), iat, exp);
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
        // 1) el JWT debe tener firma válida y no estar vencido; 2) su jti debe ser una sesión abierta (revocación)
        JwtUtil.Claims claims;
        try {
            claims = jwtUtil.verificar(token);
        } catch (JwtUtil.JwtException e) {
            throw new AutenticacionException("Token inválido: " + e.getMessage());
        }
        Sesion sesion = sesionRepository.findById(claims.jti())
                .orElseThrow(() -> new AutenticacionException("Token de sesión inválido"));
        if (!String.valueOf(sesion.getUsuarioId()).equals(claims.sub())) {
            throw new AutenticacionException("Token de sesión inválido");
        }
        return sesion;
    }

    /** Lista de usuarios con sus datos (nombre, RUT...). Solo la puede pedir un administrador. */
    @Transactional(readOnly = true)
    public List<Usuario> listarUsuarios(String token) {
        Usuario quien = validarToken(token);
        if (!quien.esAdmin()) {
            throw new AutenticacionException("Solo un administrador puede ver la lista de usuarios");
        }
        return usuarioRepository.findAll();
    }

    /** Ids de los juegos favoritos del dueño del token (cada usuario ve solo los suyos). */
    @Transactional(readOnly = true)
    public List<String> listarFavoritos(String token) {
        Usuario usuario = validarToken(token);
        return favoritoRepository.findByUsuarioId(usuario.getId()).stream().map(Favorito::getJuegoId).toList();
    }

    /** Marca un juego como favorito del dueño del token. Si ya lo era, no pasa nada. */
    @Transactional
    public void agregarFavorito(String token, String juegoId) {
        Usuario usuario = validarToken(token);
        if (juegoId == null || juegoId.isBlank()) {
            throw new IllegalArgumentException("El juego es obligatorio");
        }
        if (!favoritoRepository.existsByUsuarioIdAndJuegoId(usuario.getId(), juegoId)) {
            favoritoRepository.save(new Favorito(usuario.getId(), juegoId));
        }
    }

    /** Quita un juego de los favoritos del dueño del token. Si no estaba, no pasa nada. */
    @Transactional
    public void quitarFavorito(String token, String juegoId) {
        Usuario usuario = validarToken(token);
        favoritoRepository.deleteByUsuarioIdAndJuegoId(usuario.getId(), juegoId);
    }

    private String limpiar(String texto) {
        return (texto == null || texto.isBlank()) ? null : texto.trim();
    }

    /**
     * Valida un RUT chileno (largo, solo dígitos y dígito verificador por módulo 11)
     * y lo deja en formato "12345678-5": sin puntos, con guion y K en mayúscula.
     */
    static String normalizarRut(String rut) {
        if (rut == null || rut.isBlank()) {
            throw new IllegalArgumentException("El RUT es obligatorio");
        }
        String limpio = rut.replace(".", "").replace("-", "").replace(" ", "").toUpperCase(Locale.ROOT);
        if (limpio.length() < 2 || limpio.length() > 9) {
            throw new IllegalArgumentException("El RUT no es válido");
        }
        String cuerpo = limpio.substring(0, limpio.length() - 1);
        char dv = limpio.charAt(limpio.length() - 1);
        if (!cuerpo.chars().allMatch(Character::isDigit)) {
            throw new IllegalArgumentException("El RUT no es válido");
        }
        int suma = 0;
        int factor = 2;
        for (int i = cuerpo.length() - 1; i >= 0; i--) {
            suma += (cuerpo.charAt(i) - '0') * factor;
            factor = (factor == 7) ? 2 : factor + 1;
        }
        int resto = 11 - (suma % 11);
        char esperado = (resto == 11) ? '0' : (resto == 10) ? 'K' : (char) ('0' + resto);
        if (dv != esperado) {
            throw new IllegalArgumentException("El RUT no es válido (dígito verificador incorrecto)");
        }
        return Long.parseLong(cuerpo) + "-" + dv;
    }

    private String normalizar(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
