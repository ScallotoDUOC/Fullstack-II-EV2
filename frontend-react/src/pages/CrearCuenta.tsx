import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiUsuarios } from "../api/api";
import { useAuth } from "../context/Auth";
import { useAviso } from "../context/Toast";

export default function CrearCuenta() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [cargando, setCargando] = useState(false);
  const { login } = useAuth();
  const aviso = useAviso();
  const nav = useNavigate();
  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    const n = nombre.trim(), m = email.trim().toLowerCase();
    if (!n || !m || !pass) { aviso("Completa todos los campos para crear tu cuenta"); return; }
    if (pass.length < 6) { aviso("La contraseña debe tener al menos 6 caracteres"); return; }
    setCargando(true);
    try {
      await apiUsuarios.registrar(n, m, pass);
      await login(m, pass);
      aviso(`¡Cuenta creada! Bienvenido/a ${n}`);
      setTimeout(() => nav("/catalogo"), 900);
    } catch (err) { aviso((err as Error).message); } finally { setCargando(false); }
  };
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
                    <input type="text" className="form-control" id="nombre" required value={nombre} onChange={e => setNombre(e.target.value)} />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">Correo electrónico:</label>
                    <input type="email" className="form-control" id="email" required value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">Contraseña:</label>
                    <input type="password" className="form-control" id="password" required value={pass} onChange={e => setPass(e.target.value)} />
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
