package juegaYa.Usuarios.Repository;

import juegaYa.Usuarios.Model.Favorito;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/** Repositorio de los juegos favoritos de cada usuario. */
@Repository
public interface FavoritoRepository extends JpaRepository<Favorito, Long> {

    List<Favorito> findByUsuarioId(Integer usuarioId);

    boolean existsByUsuarioIdAndJuegoId(Integer usuarioId, String juegoId);

    void deleteByUsuarioIdAndJuegoId(Integer usuarioId, String juegoId);
}
