package juegaYa.Pedidos.Exception;

import java.time.LocalDateTime;

public class ErrorResponse {

    private final LocalDateTime fecha = LocalDateTime.now();
    private final int status;
    private final String error;
    private final String mensaje;

    public ErrorResponse(int status, String error, String mensaje) {
        this.status = status;
        this.error = error;
        this.mensaje = mensaje;
    }

    public LocalDateTime getFecha() { return fecha; }
    public int getStatus() { return status; }
    public String getError() { return error; }
    public String getMensaje() { return mensaje; }
}
