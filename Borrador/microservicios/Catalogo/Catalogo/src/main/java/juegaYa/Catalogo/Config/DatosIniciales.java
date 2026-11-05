package juegaYa.Catalogo.Config;

import juegaYa.Catalogo.Model.Categoria;
import juegaYa.Catalogo.Model.Juego;
import juegaYa.Catalogo.Model.Resena;
import juegaYa.Catalogo.Repository.JuegoRepository;
import juegaYa.Catalogo.Repository.ResenaRepository;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDate;

/**
 * Carga los juegos de fábrica de JuegaYa la primera vez que arranca (solo si la tabla está vacía),
 * para que el catálogo tenga contenido real en la base de datos.
 */
@Configuration
public class DatosIniciales {

    @Bean
    ApplicationRunner cargarCatalogoInicial(JuegoRepository juegos, ResenaRepository resenas) {
        return args -> {
            if (juegos.count() > 0) {
                return;
            }
            juegos.save(new Juego("castillo-aventura", "Castillo Aventura", Categoria.INFLABLE, 45000,
                    "Castillo con zona de salto y resbalín. Ideal para cumpleaños.",
                    "https://inflablesmidas.cl/attachments/Image/plaza-2022.jpg", "7 niños", true));
            juegos.save(new Juego("tobogan-jungla", "Tobogán Jungla", Categoria.ACUATICO, 95000,
                    "Tobogán de gran formato con piscina de poca profundidad.",
                    "https://rentaparty.cl/wp-content/uploads/2025/10/1000589305-1024x1024.jpg", "10 niños", true));
            juegos.save(new Juego("arcade-retro", "Arcade Retro", Categoria.INTERIOR, 55000,
                    "Máquina multijuegos para competir y revivir los clásicos.",
                    null, "2 jugadores", true));
            juegos.save(new Juego("taca-taca", "Taca taca", Categoria.INTERIOR, 45000,
                    "Mesa de fútbol para partidos rápidos entre amigos y familia.",
                    "https://colinainflables.imgix.net/producto/img_683a096bee7b25_97896834.jpg?fit=crop&fm=webp&h=600&lossless=true&q=25&w=600",
                    "4 jugadores", true));
            juegos.save(new Juego("hockey", "Hockey", Categoria.INTERIOR, 70000,
                    "Air hockey de tamaño completo para duelos llenos de velocidad.",
                    "https://www.juegosbabymandi.cl/img/air-hockey-grande.jpg", "2 jugadores", true));

            LocalDate hoy = LocalDate.now();
            resenas.save(new Resena("castillo-aventura", 0, "Marcela R.", 5, "Llegó impecable y los niños encantados.", hoy));
            resenas.save(new Resena("tobogan-jungla", 0, "Ignacia T.", 5, "El favorito de la fiesta, todos querían subir.", hoy));
            resenas.save(new Resena("hockey", 0, "Nicolás A.", 5, "Rápido de armar y funcionó impecable.", hoy));
        };
    }
}
