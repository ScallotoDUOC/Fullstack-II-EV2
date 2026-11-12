package juegaYa.Catalogo.Exception;

/** Se intentó algo que choca con el estado actual (por ejemplo, reservar un juego en una fecha ya ocupada) -> 409. */
public class ConflictoException extends RuntimeException {

    public ConflictoException(String mensaje) {
        super(mensaje);
    }
}
