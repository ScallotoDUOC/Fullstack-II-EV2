import type { ReactNode } from "react";

interface Props { titulo: string; onCerrar: () => void; children: ReactNode; pie?: ReactNode; }

// ventana modal simple con las clases de Bootstrap (sin su JavaScript)
export default function Modal({ titulo, onCerrar, children, pie }: Props) {
  return (
    <div className="modal d-block" style={{ background: "rgba(0,0,0,.5)" }} role="dialog" aria-modal="true" aria-label={titulo}>
      <div className="modal-dialog modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h2 className="modal-title h5">{titulo}</h2>
            <button type="button" className="btn-close" aria-label="Cerrar" onClick={onCerrar}></button>
          </div>
          <div className="modal-body">{children}</div>
          {pie && <div className="modal-footer">{pie}</div>}
        </div>
      </div>
    </div>
  );
}
