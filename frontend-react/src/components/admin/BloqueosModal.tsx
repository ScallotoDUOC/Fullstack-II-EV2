import { useState } from "react";
import { apiCatalogo } from "../../api/api";
import type { ApiJuego } from "../../api/api";
import { fechaLarga } from "../../admin/tipos";
import { useAviso } from "../../context/Toast";
import Modal from "../Modal";

interface Props { juego: ApiJuego; hoy: string; onCerrar: () => void; recargar: () => Promise<void>; }

// Bloquear y desbloquear fechas de un juego (mantención, evento propio, etc.)
export default function BloqueosModal({ juego, hoy, onCerrar, recargar }: Props) {
  const aviso = useAviso();
  const [fecha, setFecha] = useState("");
  const bloqueos = juego.bloqueos.slice().sort((a, b) => a.fecha.localeCompare(b.fecha));

  const bloquear = async () => {
    if (!fecha) { aviso("Elige una fecha"); return; }
    if (bloqueos.some(b => b.fecha === fecha)) { aviso("Esa fecha ya está ocupada"); return; }
    try { await apiCatalogo.bloquear(juego.id, fecha); setFecha(""); aviso("Fecha bloqueada"); await recargar(); }
    catch (e) { aviso((e as Error).message); }
  };
  const desbloquear = async (f: string) => {
    try { await apiCatalogo.desbloquear(juego.id, f); aviso("Fecha liberada"); await recargar(); }
    catch (e) { aviso((e as Error).message); }
  };

  return (
    <Modal titulo={`Fechas de ${juego.nombre}`} onCerrar={onCerrar}>
      <div className="d-flex flex-wrap gap-2 mb-3">
        <input type="date" className="form-control" aria-label="Fecha a bloquear" min={hoy} value={fecha} onChange={e => setFecha(e.target.value)} />
        <button className="btn btn-dark text-nowrap" onClick={bloquear}>Bloquear fecha</button>
      </div>
      {!bloqueos.length ? <p className="text-secondary mb-0">Este juego no tiene fechas ocupadas.</p> : (
        <ul className="list-group">
          {bloqueos.map((b, i) => (
            <li key={i} className="list-group-item d-flex justify-content-between align-items-center">
              <span>{fechaLarga(b.fecha)} <small className="text-secondary">· {b.reservaId !== null ? `Reserva #${b.reservaId}` : "Bloqueo manual"}</small></span>
              {b.reservaId === null
                ? <button className="btn btn-sm btn-outline-danger" onClick={() => desbloquear(b.fecha)}>Liberar</button>
                : <small className="text-secondary">Se libera cancelando la reserva</small>}
            </li>))}
        </ul>)}
    </Modal>
  );
}
