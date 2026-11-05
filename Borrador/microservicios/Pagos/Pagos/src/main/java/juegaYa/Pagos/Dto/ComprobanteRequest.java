package juegaYa.Pagos.Dto;

import juegaYa.Pagos.Model.ComprobanteTransferencia;

public class ComprobanteRequest {

    private String banco;
    private String numeroOperacion;
    private String archivoUrl;

    public ComprobanteTransferencia aModelo() {
        return new ComprobanteTransferencia(banco, numeroOperacion, archivoUrl);
    }

    public String getBanco() { return banco; }
    public void setBanco(String banco) { this.banco = banco; }
    public String getNumeroOperacion() { return numeroOperacion; }
    public void setNumeroOperacion(String numeroOperacion) { this.numeroOperacion = numeroOperacion; }
    public String getArchivoUrl() { return archivoUrl; }
    public void setArchivoUrl(String archivoUrl) { this.archivoUrl = archivoUrl; }
}
