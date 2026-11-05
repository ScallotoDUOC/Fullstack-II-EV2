package juegaYa.Usuarios.Exception;

/**
 * Falló una autenticación: credenciales incorrectas, token desconocido o sesión
 * vencida (401 Unauthorized en el controller). Los mensajes son a propósito
 * genéricos para no revelar, por ejemplo, si un email existe o no.
 */
public class AutenticacionException extends RuntimeException {

    public AutenticacionException(String mensaje) {
        super(mensaje);
    }
}
