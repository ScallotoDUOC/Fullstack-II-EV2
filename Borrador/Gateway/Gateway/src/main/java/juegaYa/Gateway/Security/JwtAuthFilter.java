package juegaYa.Gateway.Security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.regex.Pattern;

/**
 * Guardián de la API: valida el JWT (firma y vencimiento) antes de enrutar a cualquier microservicio.
 *  - Rutas públicas: login, registro, ver el catálogo y la documentación.
 *  - Rutas de administrador: crear/editar/borrar juegos, bloqueos manuales, marcar pagado, confirmar/reembolsar pagos.
 *  - Todo lo demás exige estar logueado; además un cliente solo puede pedir SUS pedidos (usuarioId = sub del token).
 * Al microservicio le llegan los headers X-Usuario-Id y X-Usuario-Rol ya verificados (los que mande el cliente se borran).
 * El cierre de sesión (revocación) lo comprueba Usuarios al ver /api/auth/*.
 */
@Component
public class JwtAuthFilter implements GlobalFilter, Ordered {

    private static final Pattern CATALOGO_ID = Pattern.compile("^/api/catalogo/[^/]+$");
    private static final Pattern CATALOGO_BLOQUEOS = Pattern.compile("^/api/catalogo/[^/]+/bloqueos$");
    private static final Pattern PEDIDO_PAGADO = Pattern.compile("^/pedidos/[^/]+/pagado$");
    private static final Pattern PAGO_ADMIN = Pattern.compile("^/pagos/[^/]+/(confirmar|reembolsar)$");
    private static final Pattern PUBLICA_DOCS = Pattern.compile("^/(docs/.*|v3/api-docs.*|swagger-ui.*|webjars/.*|actuator/health.*)$");

    private final JwtUtil jwtUtil;

    public JwtAuthFilter(@Value("${jwt.secret}") String secreto) {
        this.jwtUtil = new JwtUtil(secreto);
    }

    @Override
    public int getOrder() {
        return -100;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest req = exchange.getRequest();
        String path = req.getURI().getPath();
        HttpMethod metodo = req.getMethod();

        // el preflight de CORS no lleva token
        if (HttpMethod.OPTIONS.equals(metodo)) return chain.filter(exchange);

        boolean catalogoLectura = HttpMethod.GET.equals(metodo) && path.startsWith("/api/catalogo");
        boolean pideInactivos = "true".equalsIgnoreCase(req.getQueryParams().getFirst("incluirInactivos"));
        boolean publica = PUBLICA_DOCS.matcher(path).matches()
                || (HttpMethod.POST.equals(metodo) && (path.equals("/api/auth/login") || path.equals("/api/auth/registro")))
                || (catalogoLectura && !pideInactivos);
        if (publica) return chain.filter(limpiar(exchange, null));

        String auth = req.getHeaders().getFirst("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) return rechazar(exchange, HttpStatus.UNAUTHORIZED, "Debes iniciar sesión");
        JwtUtil.Claims claims;
        try {
            claims = jwtUtil.verificar(auth.substring(7).trim());
        } catch (JwtUtil.JwtException e) {
            return rechazar(exchange, HttpStatus.UNAUTHORIZED, "Sesión inválida o expirada");
        }

        if (!claims.esAdmin()) {
            if (esSoloAdmin(metodo, path, req) || (catalogoLectura && pideInactivos)) {
                return rechazar(exchange, HttpStatus.FORBIDDEN, "Solo un administrador puede hacer esto");
            }
            String usuarioId = req.getQueryParams().getFirst("usuarioId");
            if (usuarioId != null && path.startsWith("/pedidos") && !usuarioId.equals(claims.sub())) {
                return rechazar(exchange, HttpStatus.FORBIDDEN, "No puedes acceder a los datos de otro usuario");
            }
        }
        return chain.filter(limpiar(exchange, claims));
    }

    private static boolean esSoloAdmin(HttpMethod m, String path, ServerHttpRequest req) {
        if (HttpMethod.POST.equals(m) && path.equals("/api/catalogo")) return true;
        if ((HttpMethod.PUT.equals(m) || HttpMethod.DELETE.equals(m)) && CATALOGO_ID.matcher(path).matches()) return true;
        if (CATALOGO_BLOQUEOS.matcher(path).matches()) {
            if (HttpMethod.DELETE.equals(m)) return true;
            // bloqueo manual (sin reservaId) = admin; el que genera una reserva del cliente lleva reservaId
            if (HttpMethod.POST.equals(m)) return req.getQueryParams().getFirst("reservaId") == null;
        }
        if (HttpMethod.PUT.equals(m) && PEDIDO_PAGADO.matcher(path).matches()) return true;
        return HttpMethod.PUT.equals(m) && PAGO_ADMIN.matcher(path).matches();
    }

    /** Quita los X-Usuario-* que mande el cliente (falsificables) y pone los verificados del token. */
    private static ServerWebExchange limpiar(ServerWebExchange exchange, JwtUtil.Claims claims) {
        ServerHttpRequest nueva = exchange.getRequest().mutate().headers(h -> {
            h.remove("X-Usuario-Id");
            h.remove("X-Usuario-Rol");
            if (claims != null) {
                h.set("X-Usuario-Id", claims.sub());
                h.set("X-Usuario-Rol", claims.rol());
            }
        }).build();
        return exchange.mutate().request(nueva).build();
    }

    private static Mono<Void> rechazar(ServerWebExchange exchange, HttpStatus estado, String mensaje) {
        var resp = exchange.getResponse();
        resp.setStatusCode(estado);
        resp.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        String json = "{\"mensaje\":\"" + mensaje + "\"}";
        DataBuffer buf = resp.bufferFactory().wrap(json.getBytes(StandardCharsets.UTF_8));
        return resp.writeWith(Mono.just(buf));
    }
}
