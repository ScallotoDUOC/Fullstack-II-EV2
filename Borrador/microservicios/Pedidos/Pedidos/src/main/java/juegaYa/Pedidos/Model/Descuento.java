package juegaYa.Pedidos.Model;
public class Descuento {

    public static final String PORCENTAJE = "PORCENTAJE";
    public static final String MONTO = "MONTO";

    private String codigo;
    private String tipo;
    private float valor;
    private boolean vigente;

    public Descuento() {
    }

    public Descuento(String codigo, String tipo, float valor, boolean vigente) {
        this.codigo = codigo;
        this.tipo = tipo;
        this.valor = valor;
        this.vigente = vigente;
    }

    /**
     * Devuelve el monto a descontar sobre el subtotal (nunca mayor al subtotal).
     */
    public int aplicar(int subtotal) {
        if (!vigente || subtotal <= 0) {
            return 0;
        }
        int monto;
        if (PORCENTAJE.equalsIgnoreCase(tipo)) {
            monto = Math.round(subtotal * valor / 100f);
        } else {
            monto = Math.round(valor);
        }
        return Math.max(0, Math.min(monto, subtotal));
    }

    public String getCodigo() {
        return codigo;
    }

    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public float getValor() {
        return valor;
    }

    public void setValor(float valor) {
        this.valor = valor;
    }

    public boolean isVigente() {
        return vigente;
    }

    public void setVigente(boolean vigente) {
        this.vigente = vigente;
    }
}
