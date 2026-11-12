package juegaYa.Usuarios.Dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Datos que el usuario puede cambiar de su perfil (PUT /api/auth/me).
 * El email no se cambia. El RUT solo se acepta si la cuenta aún no tiene uno
 * (cuentas creadas antes de que el RUT fuera obligatorio); una vez guardado no se modifica.
 *
 * Límites: nombre hasta 50 caracteres (solo letras y signos de nombre), teléfono de exactamente
 * 9 dígitos (o vacío) y dirección de hasta 100 caracteres con un conjunto de signos acotado
 * (nada de < > comillas ni ; que no hacen falta en una dirección).
 */
public record PerfilDto(
        @NotBlank(message = "El nombre es obligatorio")
        @Size(min = 2, max = 50, message = "El nombre debe tener entre 2 y 50 caracteres")
        @Pattern(regexp = "^\\p{L}[\\p{L} .'\\u2019-]*$", message = "El nombre solo puede tener letras, espacios, punto, apóstrofo y guion")
        String nombre,

        @Pattern(regexp = "^(\\d{9})?$", message = "El teléfono debe tener exactamente 9 dígitos")
        String telefono,

        @Size(max = 100, message = "La dirección no puede pasar de 100 caracteres")
        @Pattern(regexp = "^[\\p{L}\\p{N} .,#\\u00B0\\u00BA\\u00AA/'\\u2019()-]*$", message = "La dirección tiene caracteres no permitidos")
        String direccion,

        @Size(max = 12, message = "El RUT no puede pasar de 12 caracteres")
        String rut
) {
}
