package juegaYa.Usuarios.Repository;

import juegaYa.Usuarios.Model.Sesion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

/**
 * Repositorio de Sesion (la llave es el token). No aparece en el diagrama, pero
 * el AuthService lo necesita: sin guardar las sesiones, cerrarSesion() y
 * validarToken() no tendrían contra qué trabajar.
 */
@Repository
public interface SesionRepository extends JpaRepository<Sesion, String> {

    /**
     * Cierra la sesión con UN solo UPDATE atómico (sin leer y luego guardar). Así varios
     * "cerrar sesión" seguidos no se pelean por la fila ni quedan esperando un bloqueo.
     * Devuelve cuántas filas cambió (0 si ya estaba cerrada o no existe).
     */
    @Modifying
    @Query("update Sesion s set s.expiraEn = :ahora where s.token = :token and s.expiraEn > :ahora")
    int cerrar(@Param("token") String token, @Param("ahora") LocalDateTime ahora);
}
