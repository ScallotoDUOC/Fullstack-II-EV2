package juegaYa.Gateway.filter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/** Registra en el log cada peticion que pasa por el gateway: metodo, ruta, estado y duracion. */
@Component
public class RequestLoggingFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(RequestLoggingFilter.class);

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        long inicio = System.currentTimeMillis();
        String metodo = exchange.getRequest().getMethod().name();
        String ruta = exchange.getRequest().getURI().getPath();

        return chain.filter(exchange).doFinally(senal -> log.info("{} {} -> {} ({} ms)",
                metodo, ruta, exchange.getResponse().getStatusCode(),
                System.currentTimeMillis() - inicio));
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }
}
