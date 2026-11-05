package juegaYa.Usuarios.Exception;

/** Se intentó registrar un email que ya tiene cuenta (409 Conflict en el controller). */
public class EmailYaRegistradoException extends RuntimeException {

    public EmailYaRegistradoException(String email) {
        super("Ya existe una cuenta con el email " + email);
    }
}
