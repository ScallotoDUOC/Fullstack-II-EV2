package juegaYa.Usuarios.Exception;

/** Se intentó registrar un RUT que ya pertenece a otra cuenta (409 Conflict en el controller). */
public class RutYaRegistradoException extends RuntimeException {

    public RutYaRegistradoException(String rut) {
        super("Ya existe una cuenta con el RUT " + rut);
    }
}
