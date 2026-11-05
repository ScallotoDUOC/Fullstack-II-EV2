package juegaYa.Catalogo.Exception;

/**
 * Se lanza cuando se pide un juego (u otro recurso del catálogo) por id y no existe.
 * Es unchecked a propósito, para no obligar a todos los métodos del servicio a
 * declarar "throws" - en el controller se captura con un @ExceptionHandler y se
 * traduce a un 404.
 */
public class RecursoNoEncontradoException extends RuntimeException {

    public RecursoNoEncontradoException(String mensaje) {
        super(mensaje);
    }
}