package juegaYa.Usuarios.Dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Credenciales para iniciar sesión (POST /api/auth/login). */
public record LoginDto(
        @NotBlank(message = "El email es obligatorio")
        @Size(max = 100, message = "El email no puede pasar de 100 caracteres")
        String email,

        @NotBlank(message = "La contraseña es obligatoria")
        @Size(max = 64, message = "La contraseña no puede pasar de 64 caracteres")
        String password
) {
}
