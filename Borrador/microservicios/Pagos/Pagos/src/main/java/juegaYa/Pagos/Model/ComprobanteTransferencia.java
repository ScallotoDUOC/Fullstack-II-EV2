package juegaYa.Pagos.Model;

public class ComprobanteTransferencia {

    private int pagoId;
    private String banco;
    private String numeroOperacion;
    private String archivoUrl;
    private boolean verificado;

    public ComprobanteTransferencia() {
    }

    public ComprobanteTransferencia(String banco, String numeroOperacion, String archivoUrl) {
        this.banco = banco;
        this.numeroOperacion = numeroOperacion;
        this.archivoUrl = archivoUrl;
    }

    public void verificar() {
        this.verificado = true;
    }

    public int getPagoId() {
        return pagoId;
    }

    public void setPagoId(int pagoId) {
        this.pagoId = pagoId;
    }

    public String getBanco() {
        return banco;
    }

    public void setBanco(String banco) {
        this.banco = banco;
    }

    public String getNumeroOperacion() {
        return numeroOperacion;
    }

    public void setNumeroOperacion(String numeroOperacion) {
        this.numeroOperacion = numeroOperacion;
    }

    public String getArchivoUrl() {
        return archivoUrl;
    }

    public void setArchivoUrl(String archivoUrl) {
        this.archivoUrl = archivoUrl;
    }

    public boolean isVerificado() {
        return verificado;
    }

    public void setVerificado(boolean verificado) {
        this.verificado = verificado;
    }
}
