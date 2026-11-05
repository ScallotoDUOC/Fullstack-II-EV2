package juegaYa.Pedidos.Config;

import juegaYa.Pedidos.Repository.PedidoRepository;
import juegaYa.Pedidos.Service.PedidoService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Registra como beans el repository y el service, que son clases Java simples. */
@Configuration
public class PedidoConfig {

    @Bean
    public PedidoRepository pedidoRepository() {
        return new PedidoRepository();
    }

    @Bean
    public PedidoService pedidoService(PedidoRepository repository) {
        return new PedidoService(repository);
    }
}
