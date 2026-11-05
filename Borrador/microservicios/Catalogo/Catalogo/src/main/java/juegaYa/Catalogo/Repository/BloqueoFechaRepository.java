package juegaYa.Catalogo.Repository;

import juegaYa.Catalogo.Model.BloqueoFecha;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BloqueoFechaRepository extends JpaRepository<BloqueoFecha, Integer> {

    List<BloqueoFecha> findByJuegoId(String juegoId);

    List<BloqueoFecha> findByReservaId(Integer reservaId);
}