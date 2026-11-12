package juegaYa.Usuarios.Security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Crea el JwtUtil con el secreto de application.properties (jwt.secret / variable JWT_SECRET). */
@Configuration
public class JwtConfig {

    @Bean
    public JwtUtil jwtUtil(@Value("${jwt.secret}") String secreto) {
        return new JwtUtil(secreto);
    }
}
