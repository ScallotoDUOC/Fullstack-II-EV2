package juegaYa.Pagos.Service;

import juegaYa.Pagos.Exception.EstadoPagoInvalidoException;
import juegaYa.Pagos.Exception.PagoNoEncontradoException;
import juegaYa.Pagos.Model.ComprobanteTransferencia;
import juegaYa.Pagos.Model.EstadoPago;
import juegaYa.Pagos.Model.MetodoPago;
import juegaYa.Pagos.Model.Pago;
import juegaYa.Pagos.Repository.PagoRepository;

import java.util.Optional;
import java.util.UUID;

public class PagoService {

    private final PagoRepository repository;

    public PagoService(PagoRepository repository) {
        this.repository = repository;
    }

    public Pago iniciarPago(int pedidoId, int montoTotal, MetodoPago metodo) {
        return iniciarPago(pedidoId, 0, montoTotal, metodo);
    }

    public Pago iniciarPago(int pedidoId, int usuarioId, int montoTotal, MetodoPago metodo) {
        if (montoTotal <= 0) {
            throw new IllegalArgumentException("El monto debe ser mayor a 0");
        }
        if (metodo == null) {
            throw new IllegalArgumentException("Debe indicar el metodo de pago");
        }
        Optional<Pago> existente = repository.buscarPorPedido(pedidoId);
        if (existente.isPresent() && (existente.get().getEstado() == EstadoPago.PENDIENTE
                || existente.get().getEstado() == EstadoPago.APROBADO)) {
            throw new EstadoPagoInvalidoException(
                    "El pedido " + pedidoId + " ya tiene un pago " + existente.get().getEstado());
        }
        Pago pago = new Pago(pedidoId, usuarioId, montoTotal, metodo);
        guardar(pago);
        return pago;
    }

    public ComprobanteTransferencia registrarComprobante(int pagoId, ComprobanteTransferencia datos) {
        Pago pago = obtener(pagoId);
        if (pago.getMetodo() != MetodoPago.TRANSFERENCIA) {
            throw new EstadoPagoInvalidoException("Solo los pagos por transferencia llevan comprobante");
        }
        if (pago.getEstado() != EstadoPago.PENDIENTE) {
            throw new EstadoPagoInvalidoException(
                    "No se puede registrar comprobante en un pago " + pago.getEstado());
        }
        if (datos == null || esVacio(datos.getBanco()) || esVacio(datos.getNumeroOperacion())) {
            throw new IllegalArgumentException("El banco y el numero de operacion son obligatorios");
        }
        datos.setPagoId(pagoId);
        pago.setComprobante(datos);
        pago.setReferenciaExterna(datos.getNumeroOperacion());
        guardar(pago);
        return datos;
    }

    public Pago confirmarPago(int pagoId) {
        Pago pago = obtener(pagoId);
        ComprobanteTransferencia comprobante = pago.getComprobante();
        if (pago.getMetodo() == MetodoPago.TRANSFERENCIA && comprobante == null) {
            throw new EstadoPagoInvalidoException("La transferencia no tiene comprobante registrado");
        }
        pago.aprobar();
        if (comprobante != null) {
            comprobante.verificar();
        }
        if (pago.getReferenciaExterna() == null) {
            pago.setReferenciaExterna("REF-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }
        guardar(pago);
        return pago;
    }

    public Pago reembolsar(int pagoId) {
        Pago pago = obtener(pagoId);
        pago.reembolsar();
        guardar(pago);
        return pago;
    }

    public Pago pagoDe(int pedidoId) {
        return repository.buscarPorPedido(pedidoId)
                .orElseThrow(() -> PagoNoEncontradoException.porPedido(pedidoId));
    }

    public EstadoPago estadoDe(int pedidoId) {
        return repository.buscarPorPedido(pedidoId)
                .map(Pago::getEstado)
                .orElseThrow(() -> PagoNoEncontradoException.porPedido(pedidoId));
    }

    private Pago obtener(int pagoId) {
        return repository.buscarPorId(pagoId)
                .orElseThrow(() -> PagoNoEncontradoException.porId(pagoId));
    }

    private void guardar(Pago pago) {
        if (!repository.guardar(pago)) {
            throw new IllegalStateException("No se pudo guardar el pago " + pago.getId());
        }
    }

    private boolean esVacio(String s) {
        return s == null || s.isBlank();
    }
}
