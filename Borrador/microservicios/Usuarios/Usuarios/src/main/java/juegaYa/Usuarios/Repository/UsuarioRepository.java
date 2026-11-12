package juegaYa.Usuarios.Repository;

import juegaYa.Usuarios.Model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repositorio de Usuario. Cubre las operaciones del diagrama: buscarPorEmail
 * (findByEmail), buscarPorId (findById, ya viene en JpaRepository) y guardar
 * (save, también heredado). existsByEmail se agregó para poder rechazar un
 * registro con email repetido sin traer el usuario completo.
 */
@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {

    Optional<Usuario> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByRut(String rut);
}
