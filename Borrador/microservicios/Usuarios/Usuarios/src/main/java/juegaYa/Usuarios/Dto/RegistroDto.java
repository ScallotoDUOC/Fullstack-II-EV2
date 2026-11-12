package juegaYa.Usuarios.Dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Datos para crear una cuenta nueva (POST /api/auth/registro). Los límites de largo y de
 * formato evitan datos absurdos o demasiado grandes (por ejemplo, una "contraseña" de
 * 1 MB haría trabajar de más al hash PBKDF2).
 */
public record RegistroDto(
        @NotBlank(message = "El nombre es obligatorio")
        @Size(min = 2, max = 50, message = "El nombre debe tener entre 2 y 50 caracteres")
        @Pattern(regexp = "^\\p{L}[\\p{L} .'\\u2019-]*$", message = "El nombre solo puede tener letras, espacios, punto, apóstrofo y guion")
        String nombre,

        @NotBlank(message = "El email es obligatorio")
        @Email(message = "El email no es válido")
        @Size(max = 100, message = "El email no puede pasar de 100 caracteres")
        String email,

        @NotBlank(message = "El RUT es obligatorio")
        @Size(max = 12, message = "El RUT no puede pasar de 12 caracteres")
        String rut,

        @NotBlank(message = "La contraseña es obligatoria")
        @Size(min = 6, max = 64, message = "La contraseña debe tener entre 6 y 64 caracteres")
        String password
) {
}
