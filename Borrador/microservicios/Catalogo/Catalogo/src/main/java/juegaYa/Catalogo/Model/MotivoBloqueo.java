package juegaYa.Catalogo.Model;

/**
 * Motivo por el que una fecha queda bloqueada para un juego específico.
 * - RESERVA: la fecha quedó tomada porque se creó una reserva (ver {//@link BloqueoFecha#getReservaId()}).
 * - MANUAL: el administrador bloqueó la fecha a mano (mantención, evento propio, etc.).
 * - MANTENCION: el juego está en mantención y no se puede arrendar esos días.
 */
public enum MotivoBloqueo {
    RESERVA,
    MANUAL,
    MANTENCION
}