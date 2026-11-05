package juegaYa.Usuarios.Model;

/**
 * Rol que tiene un usuario dentro de JuegaYa. Definido en el diagrama como
 * enumeración asociada a Usuario.
 * - CLIENTE: arrienda juegos y deja reseñas.
 * - ADMINISTRADOR: gestiona el catálogo, las reservas y el resto del panel.
 */
public enum Rol {
    CLIENTE,
    ADMINISTRADOR
}
