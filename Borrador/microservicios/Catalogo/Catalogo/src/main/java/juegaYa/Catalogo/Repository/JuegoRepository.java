package juegaYa.Catalogo.Repository;

import juegaYa.Catalogo.Model.Juego;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repositorio de Juego. No le puse métodos de búsqueda por categoría/texto/precio
 * porque esos filtros se combinan de a varios y son opcionales (listar() puede
 * recibir cualquier combinación de categoria/texto/rangoPrecio, o ninguno) -
 * para esa combinatoria es más simple filtrar en el servicio sobre findAll()
 * que armar media docena de métodos derivados o una Specification. Si el catálogo
 * crece mucho y eso deja de rendir bien, ahí conviene pasarse a Specification.
 */
@Repository
public interface JuegoRepository extends JpaRepository<Juego, String> {
}