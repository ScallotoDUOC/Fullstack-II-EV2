package juegaYa.Catalogo.Dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

/**
 * Lo que manda el cliente al dejar una reseña (POST /catalogo/{id}/resenas).
 * El juegoId no va acá: viene de la URL. La fecha es opcional - si no la mandan,
 * el controller la completa con la fecha de hoy.
 */
public record ResenaDto(
        int usuarioId,
        @NotBlank String autor,
        @Min(1) @Max(5) int estrellas,
        String comentario,
        LocalDate fecha
) {
}