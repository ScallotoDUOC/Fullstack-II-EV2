package juegaYa.Pedidos.Model;

public class Comuna {

    private String nombre;
    private int tarifaTransporte;

    public Comuna() {
    }

    public Comuna(String nombre, int tarifaTransporte) {
        this.nombre = nombre;
        this.tarifaTransporte = tarifaTransporte;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public int getTarifaTransporte() {
        return tarifaTransporte;
    }

    public void setTarifaTransporte(int tarifaTransporte) {
        this.tarifaTransporte = tarifaTransporte;
    }
}
