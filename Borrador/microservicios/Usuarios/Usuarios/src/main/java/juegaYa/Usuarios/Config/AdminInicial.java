package juegaYa.Usuarios.Config;

import juegaYa.Usuarios.Model.Rol;
import juegaYa.Usuarios.Model.Usuario;
import juegaYa.Usuarios.Repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Crea la cuenta de administrador la primera vez que arranca el servicio (el registro público
 * solo crea clientes). Credenciales configurables en application.properties / variables de entorno.
 */
@Configuration
public class AdminInicial {

    @Bean
    ApplicationRunner crearAdministrador(UsuarioRepository usuarios,
                                          @Value("${juegaya.admin.email:admin@juegaya.cl}") String email,
                                          @Value("${juegaya.admin.password:admin123}") String password) {
        return args -> {
            if (!usuarios.existsByEmail(email)) {
                usuarios.save(new Usuario("Administrador", email, Usuario.hashearPassword(password), Rol.ADMINISTRADOR));
            }
        };
    }
}
