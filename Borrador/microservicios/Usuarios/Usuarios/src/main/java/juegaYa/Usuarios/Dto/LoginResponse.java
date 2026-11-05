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

    public static LoginResponse de(Sesion sesion, Usuario usuario) {
        return new LoginResponse(sesion.getToken(), sesion.getExpiraEn(), UsuarioResponse.de(usuario));
    }
}
