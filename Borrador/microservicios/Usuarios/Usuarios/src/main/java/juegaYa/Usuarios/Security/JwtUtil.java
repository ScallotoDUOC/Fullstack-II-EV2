package juegaYa.Usuarios.Security;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * JWT firmado con HS256 (HMAC-SHA256), sin librerías externas: solo el JDK.
 * Formato estándar: base64url(header).base64url(payload).base64url(firma).
 * Claims: sub (id del usuario), rol, jti (id de la sesión, sirve para revocar al cerrar sesión), iat y exp.
 * El payload se lee SOLO después de comprobar la firma, por eso basta un parser simple.
 * Esta misma clase está en Usuarios (emite y valida) y en Gateway (valida); el secreto debe ser el mismo.
 */
public final class JwtUtil {

    public static final class JwtException extends RuntimeException {
        public JwtException(String mensaje) { super(mensaje); }
    }

    public record Claims(String sub, String rol, String jti, long iat, long exp) {
        public boolean esAdmin() { return "ADMINISTRADOR".equals(rol); }
    }

    private static final String HEADER = "{\"alg\":\"HS256\",\"typ\":\"JWT\"}";
    private static final Base64.Encoder B64 = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder B64D = Base64.getUrlDecoder();

    private final byte[] secreto;

    public JwtUtil(String secreto) {
        if (secreto == null || secreto.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalArgumentException("jwt.secret debe tener al menos 32 caracteres");
        }
        this.secreto = secreto.getBytes(StandardCharsets.UTF_8);
    }

    /** Crea un token firmado. iat y exp van en segundos desde 1970. */
    public String generar(String sub, String rol, String jti, long iat, long exp) {
        String payload = "{\"sub\":\"" + esc(sub) + "\",\"rol\":\"" + esc(rol) + "\",\"jti\":\"" + esc(jti)
                + "\",\"iat\":" + iat + ",\"exp\":" + exp + "}";
        String cuerpo = B64.encodeToString(HEADER.getBytes(StandardCharsets.UTF_8)) + "."
                + B64.encodeToString(payload.getBytes(StandardCharsets.UTF_8));
        return cuerpo + "." + B64.encodeToString(firmar(cuerpo));
    }

    /** Comprueba firma y expiración y devuelve los claims. Lanza JwtException si algo no calza. */
    public Claims verificar(String token) {
        if (token == null) throw new JwtException("Falta el token");
        String[] partes = token.split("\\.", -1);
        if (partes.length != 3) throw new JwtException("Token mal formado");
        byte[] esperada = firmar(partes[0] + "." + partes[1]);
        byte[] recibida;
        String header;
        try {
            recibida = B64D.decode(partes[2]);
            header = new String(B64D.decode(partes[0]), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException e) {
            throw new JwtException("Token mal formado");
        }
        // comparación en tiempo constante; además se exige alg HS256 (evita el ataque alg=none)
        if (!MessageDigest.isEqual(esperada, recibida) || !header.replace(" ", "").contains("\"alg\":\"HS256\"")) {
            throw new JwtException("Firma inválida");
        }
        String payload;
        try {
            payload = new String(B64D.decode(partes[1]), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException e) {
            throw new JwtException("Token mal formado");
        }
        String sub = texto(payload, "sub");
        String jti = texto(payload, "jti");
        long exp = numero(payload, "exp");
        if (sub == null || jti == null || exp == 0) throw new JwtException("Token incompleto");
        if (System.currentTimeMillis() / 1000 >= exp) throw new JwtException("Token expirado");
        String rol = texto(payload, "rol");
        return new Claims(sub, rol == null ? "CLIENTE" : rol, jti, numero(payload, "iat"), exp);
    }

    private byte[] firmar(String datos) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secreto, "HmacSHA256"));
            return mac.doFinal(datos.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new IllegalStateException("No se pudo firmar el token", e);
        }
    }

    private static String esc(String s) {
        return s == null ? "" : s.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private static String texto(String json, String campo) {
        Matcher m = Pattern.compile("\"" + campo + "\"\\s*:\\s*\"((?:[^\"\\\\]|\\\\.)*)\"").matcher(json);
        return m.find() ? m.group(1).replace("\\\"", "\"").replace("\\\\", "\\") : null;
    }

    private static long numero(String json, String campo) {
        Matcher m = Pattern.compile("\"" + campo + "\"\\s*:\\s*(\\d+)").matcher(json);
        return m.find() ? Long.parseLong(m.group(1)) : 0;
    }
}
