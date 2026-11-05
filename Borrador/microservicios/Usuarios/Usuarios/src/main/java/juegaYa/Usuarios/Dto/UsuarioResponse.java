package juegaYa.Usuarios.Dto;

import juegaYa.Usuarios.Model.Rol;
import juegaYa.Usuarios.Model.Usuario;

import java.time.LocalDateTime;

/**
 * Lo que se le muestra al cliente de un usuario. A propósito NO trae el campo
 * password (el hash), para que nunca salga en un JSON.
 */
public record UsuarioResponse(
        Integer id,
        String nombre,
        String email,
        Rol rol,
        LocalDateTime fechaRegistro
) {

    public static UsuarioResponse de(Usuario u) {
        return new UsuarioResponse(u.getId(), u.getNombre(), u.getEmail(), u.getRol(), u.getFechaRegistro());
    }
}
