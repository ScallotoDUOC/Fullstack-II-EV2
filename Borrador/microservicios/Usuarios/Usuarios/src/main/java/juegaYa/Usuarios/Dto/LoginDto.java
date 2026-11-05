package juegaYa.Usuarios.Dto;

import jakarta.validation.constraints.NotBlank;

/** Credenciales para iniciar sesión (POST /api/auth/login). */
public record LoginDto(
        @NotBlank(message = "El email es obligatorio")
        String email,

        @NotBlank(message = "La contraseña es obligatoria")
        String password
) {
}
