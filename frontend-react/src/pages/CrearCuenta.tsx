import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { apiUsuarios } from "../api/api";
import { useAuth } from "../context/Auth";
import { useAviso } from "../context/Toast";
import { normalizarRut } from "../utils";
import { errorEmail, errorNombre, errorPassword, LIMITES } from "../validaciones";

export default function CrearCuenta() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [rut, setRut] = useState("");
  const [pass, setPass] = useState("");
  const [cargando, setCargando] = useState(false);
  const { login, sesion } = useAuth();
  const aviso = useAviso();
  const nav = useNavigate();
  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    const n = nombre.trim(), m = email.trim().toLowerCase();
    const r = normalizarRut(rut);
    if (!r) { aviso("El RUT no es válido. Ejemplo: 12.345.678-5"); return; }
    const problema = errorNombre(n) || errorEmail(m) || errorPassword(pass);
    if (problema) { aviso(problema); return; }
    setCargando(true);
    try {
      await apiUsuarios.registrar(n, m, pass, r);
      await login(m, pass);
      aviso(`¡Cuenta creada! Bienvenido/a ${n}`);
      setTimeout(() => nav("/catalogo"), 900);
    } catch (err) { aviso((err as Error).message); } finally { setCargando(false); }
  };
  // Con sesión iniciada no tiene sentido mostrar este formulario
  if (sesion) return <Navigate to={sesion.rol === "ADMINISTRADOR" ? "/admin" : "/catalogo"} replace />;
  return (
    <main>
      <section className="py-5 bg-light border-top" id="registro">
        <div className="container py-lg-4">
          <div className="row justify-content-center">
            <div className="col-md-6 col-lg-5">
              <div className="card shadow-sm border-0 p-4">
                <form onSubmit={enviar}>
                  <h2 className="h3 fw-bold mb-4 text-center">Crear Perfil</h2>
                  <div className="mb-3">
                    <label htmlFor="nombre" className="form-label">Nombre:</label>
                    <input type="text" className="form-control" id="nombre" required maxLength={LIMITES.nombre} autoComplete="name" value={nombre} onChange={e => setNombre(e.target.value)} />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="rut" className="form-label">RUT:</label>
                    <input type="text" className="form-control" id="rut" required maxLength={LIMITES.rut} placeholder="12.345.678-5" autoComplete="off" value={rut} onChange={e => setRut(e.target.value)} />
                    <div className="form-text">Es tu identificador único de cliente y no podrá cambiarse después.</div>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">Correo electrónico:</label>
                    <input type="email" className="form-control" id="email" required maxLength={LIMITES.email} autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">Contraseña:</label>
                    <input type="password" className="form-control" id="password" required minLength={6} maxLength={LIMITES.password} autoComplete="new-password" value={pass} onChange={e => setPass(e.target.value)} />
                  </div>
                  <button type="submit" className="btn btn-dark w-100 rounded-pill py-2 mt-2" disabled={cargando}>{cargando ? "Creando..." : "Registrarse"}</button>
                  <p className="text-center text-secondary small mt-3 mb-0">¿Ya tienes cuenta? <Link to="/iniciar-sesion">Inicia sesión</Link></p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
