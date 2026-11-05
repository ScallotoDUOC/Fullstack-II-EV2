package juegaYa.Usuarios.Repository;

import juegaYa.Usuarios.Model.Sesion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repositorio de Sesion (la llave es el token). No aparece en el diagrama, pero
 * el AuthService lo necesita: sin guardar las sesiones, cerrarSesion() y
 * validarToken() no tendrían contra qué trabajar.
 */
@Repository
public interface SesionRepository extends JpaRepository<Sesion, String> {
}
