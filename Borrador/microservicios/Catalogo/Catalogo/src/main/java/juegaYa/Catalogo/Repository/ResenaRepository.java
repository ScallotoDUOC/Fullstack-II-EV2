package juegaYa.Catalogo.Repository;

import juegaYa.Catalogo.Model.Resena;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResenaRepository extends JpaRepository<Resena, Integer> {

    List<Resena> findByJuegoId(String juegoId);
}