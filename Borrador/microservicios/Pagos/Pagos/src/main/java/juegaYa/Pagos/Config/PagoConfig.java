package juegaYa.Pagos.Config;

import juegaYa.Pagos.Repository.PagoRepository;
import juegaYa.Pagos.Service.PagoService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Registra como beans el repository y el service, que son clases Java simples. */
@Configuration
public class PagoConfig {

    @Bean
    public PagoRepository pagoRepository() {
        return new PagoRepository();
    }

    @Bean
    public PagoService pagoService(PagoRepository repository) {
        return new PagoService(repository);
    }
}
