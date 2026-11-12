import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../context/Auth";
import { useAviso } from "../context/Toast";
import { formatearRut, normalizarRut } from "../utils";
import { errorDireccion, errorNombre, errorTelefono, LIMITES, soloDigitos } from "../validaciones";

// Datos del cliente: RUT y correo se muestran fijos; nombre, teléfono y dirección se pueden cambiar
export default function Perfil() {
  const { sesion, actualizarPerfil, refrescarPerfil } = useAuth();
  const aviso = useAviso();
  const [nombre, setNombre] = useState(sesion?.nombre ?? "");
  const [telefono, setTelefono] = useState(sesion?.telefono ?? "");
  const [direccion, setDireccion] = useState(sesion?.direccion ?? "");
  const [rut, setRut] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Trae los datos más recientes del servidor (sesiones antiguas no guardaban RUT, teléfono ni dirección)
  useEffect(() => { void refrescarPerfil(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!sesion) return;
    setNombre(sesion.nombre); setTelefono(sesion.telefono ?? ""); setDireccion(sesion.direccion ?? "");
  }, [sesion?.nombre, sesion?.telefono, sesion?.direccion]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!sesion) return null;
  const tieneRut = !!sesion.rut;

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    const problema = errorNombre(nombre) || errorTelefono(telefono) || errorDireccion(direccion);
    if (problema) { aviso(problema); return; }
    let rutNuevo: string | undefined;
    if (!tieneRut && rut.trim()) {
      const r = normalizarRut(rut);
      if (!r) { aviso("El RUT no es válido. Ejemplo: 12.345.678-5"); return; }
      rutNuevo = r;
    }
    setGuardando(true);
    try {
      await actualizarPerfil({ nombre: nombre.trim(), telefono: telefono.trim(), direccion: direccion.trim(), ...(rutNuevo ? { rut: rutNuevo } : {}) });
      setRut(""); aviso("Datos actualizados");
    } catch (err) { aviso((err as Error).message); } finally { setGuardando(false); }
  };

  return (
    <main>
      <section className="py-5 bg-light border-top" id="perfil">
        <div className="container py-lg-4">
          <div className="row justify-content-center">
            <div className="col-md-8 col-lg-6">
              <div className="card shadow-sm border-0 p-4">
                <form onSubmit={guardar}>
                  <h1 className="h3 fw-bold mb-1 text-center">Mis datos</h1>
                  <p className="text-secondary text-center small mb-4">Aquí puedes ver y actualizar la información de tu perfil.</p>
                  <div className="mb-3">
                    <label htmlFor="perfilRut" className="form-label">RUT:</label>
                    {tieneRut ? (
                      <>
                        <input type="text" className="form-control" id="perfilRut" value={formatearRut(sesion.rut!)} readOnly disabled />
                        <div className="form-text">Es tu identificador único y no se puede modificar.</div>
                      </>
                    ) : (
                      <>
                        <input type="text" className="form-control" id="perfilRut" placeholder="12.345.678-5" maxLength={LIMITES.rut} autoComplete="off" value={rut} onChange={e => setRut(e.target.value)} />
                        <div className="form-text text-warning-emphasis">Tu cuenta aún no tiene RUT. Agrégalo ahora: una vez guardado no podrá cambiarse.</div>
                      </>
                    )}
                  </div>
                  <div className="mb-3">
                    <label htmlFor="perfilEmail" className="form-label">Correo electrónico:</label>
                    <input type="email" className="form-control" id="perfilEmail" value={sesion.email} readOnly disabled />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="perfilNombre" className="form-label">Nombre:</label>
                    <input type="text" className="form-control" id="perfilNombre" required maxLength={LIMITES.nombre} value={nombre} onChange={e => setNombre(e.target.value)} />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="perfilTelefono" className="form-label">Número de teléfono:</label>
                    <input type="tel" inputMode="numeric" className="form-control" id="perfilTelefono" placeholder="912345678" maxLength={LIMITES.telefono} value={telefono} onChange={e => setTelefono(soloDigitos(e.target.value, LIMITES.telefono))} />
                    <div className="form-text">9 dígitos, sin espacios ni +56. Ej: 912345678</div>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="perfilDireccion" className="form-label">Dirección:</label>
                    <input type="text" className="form-control" id="perfilDireccion" placeholder="Calle, número, comuna" maxLength={LIMITES.direccion} value={direccion} onChange={e => setDireccion(e.target.value)} />
                    <div className="form-text text-end">{direccion.length}/{LIMITES.direccion}</div>
                  </div>
                  <button type="submit" className="btn btn-dark w-100 rounded-pill py-2 mt-2" disabled={guardando}>{guardando ? "Guardando..." : "Guardar cambios"}</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
