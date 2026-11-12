package juegaYa.Usuarios.Dto;

import juegaYa.Usuarios.Model.Sesion;
import juegaYa.Usuarios.Model.Usuario;

import java.time.LocalDateTime;

/** Respuesta de un login exitoso: el token para mandar en "Authorization: Bearer ..." y el usuario. */
public record LoginResponse(
        String token,
        LocalDateTime expiraEn,
        UsuarioResponse usuario
) {

    /** El token que se devuelve es el JWT (no el id interno de la sesión). */
    public static LoginResponse de(String jwt, Sesion sesion, Usuario usuario) {
        return new LoginResponse(jwt, sesion.getExpiraEn(), UsuarioResponse.de(usuario));
    }
}
