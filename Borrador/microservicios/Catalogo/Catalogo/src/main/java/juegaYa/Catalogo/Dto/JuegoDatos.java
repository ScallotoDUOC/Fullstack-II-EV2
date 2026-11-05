package juegaYa.Catalogo.Dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import juegaYa.Catalogo.Model.Categoria;

/**
 * Lo que llega del cliente cuando crea o edita un juego (el "datos" que aparece
 * en el diagrama para crear(datos) y editar(id, datos)). Es a propósito una clase
 * aparte de Juego: así el controller/servicio no reciben directamente una entidad
 * JPA desde afuera, y el "id" se maneja por separado (se genera al crear, va en
 * la URL al editar).
 */
public record JuegoDatos(
        @NotBlank String nombre,
        @NotNull Categoria categoria,
        @Positive int precioJornada,
        String descripcion,
        String imagenUrl,
        String capacidad,
        boolean activo
) {
}