package juegaYa.Catalogo.Dto;

/**
 * Filtro de precio para listar(categoria, texto, rangoPrecio). Los dos límites
 * son opcionales: si viene null, no se restringe por ese lado (p. ej. "mínimo
 * 30000, sin máximo" se expresa como new RangoPrecio(30000, null)).
 */
public record RangoPrecio(Integer minimo, Integer maximo) {

    public boolean contiene(int precio) {
        if (minimo != null && precio < minimo) {
            return false;
        }
        if (maximo != null && precio > maximo) {
            return false;
        }
        return true;
    }
}