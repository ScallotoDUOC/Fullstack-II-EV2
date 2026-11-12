import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/Auth";
import { useAviso } from "../context/Toast";
import { LIMITES } from "../validaciones";

export default function IniciarSesion() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [cargando, setCargando] = useState(false);
  const { login, sesion } = useAuth();
  const aviso = useAviso();
  const nav = useNavigate();
  const enviar = async (e: FormEvent) => {
    e.preventDefault(); setCargando(true);
    try {
      const s = await login(email.trim().toLowerCase(), pass);
      aviso(`¡Hola de nuevo, ${s.nombre}!`);
      setTimeout(() => nav(s.rol === "ADMINISTRADOR" ? "/admin" : "/catalogo"), 700);
    } catch (err) { aviso((err as Error).message); } finally { setCargando(false); }
  };
  // Con sesión iniciada no tiene sentido mostrar este formulario
  if (sesion) return <Navigate to={sesion.rol === "ADMINISTRADOR" ? "/admin" : "/catalogo"} replace />;
  return (
    <main>
      <section className="py-5 bg-light border-top" id="login">
        <div className="container py-lg-4">
          <div className="row justify-content-center">
            <div className="col-md-6 col-lg-5">
              <div className="card shadow-sm border-0 p-4">
                <form onSubmit={enviar}>
                  <h2 className="h3 fw-bold mb-4 text-center">Iniciar Sesión</h2>
                  <div className="mb-3">
                    <label htmlFor="loginEmail" className="form-label">Correo electrónico:</label>
                    <input type="email" className="form-control" id="loginEmail" required maxLength={LIMITES.email} value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="loginPassword" className="form-label">Contraseña:</label>
                    <input type="password" className="form-control" id="loginPassword" required maxLength={LIMITES.password} value={pass} onChange={e => setPass(e.target.value)} />
                  </div>
                  <button type="submit" className="btn btn-primary w-100 rounded-pill py-2 mt-2" disabled={cargando}>{cargando ? "Entrando..." : "Entrar"}</button>
                  <p className="text-center text-secondary small mt-3 mb-0">¿No tienes cuenta? <Link to="/crear-cuenta">Créala aquí</Link></p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
