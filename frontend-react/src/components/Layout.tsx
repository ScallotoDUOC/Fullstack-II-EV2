import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/Auth";
import { useCart } from "../context/Cart";
import CartDrawer from "./CartDrawer";

export default function Layout() {
  const [menu, setMenu] = useState(false);
  const { sesion, logout } = useAuth();
  const { items, setAbierto } = useCart();
  const nav = useNavigate();
  const cls = ({ isActive }: { isActive: boolean }) => `nav-link${isActive ? " active" : ""}`;
  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-light bg-white sticky-top border-bottom">
        <div className="container py-2">
          <Link className="navbar-brand d-flex align-items-center gap-2 fw-bold" to="/">
            <span className="brand-mark"><i className="bi bi-controller"></i></span>JuegaYa
          </Link>
          <button className="navbar-toggler" type="button" aria-controls="menuPrincipal" aria-expanded={menu} aria-label="Abrir menú" onClick={() => setMenu(!menu)}>
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className={`collapse navbar-collapse${menu ? " show" : ""}`} id="menuPrincipal">
            <ul className="navbar-nav ms-auto me-lg-3 gap-lg-2" onClick={() => setMenu(false)}>
              <li className="nav-item"><NavLink className={cls} to="/iniciar-sesion">Iniciar sesión</NavLink></li>
              <li className="nav-item"><NavLink className={cls} to="/crear-cuenta">Crear cuenta</NavLink></li>
              <li className="nav-item"><NavLink className={cls} to="/catalogo">Catálogo</NavLink></li>
              <li className="nav-item"><NavLink className={cls} to="/mis-reservas">Mis reservas</NavLink></li>
              <li className="nav-item"><a className="nav-link" href="#contacto">Contacto</a></li>
              {sesion?.rol === "ADMINISTRADOR" && <li className="nav-item"><NavLink className={cls} to="/admin">Admin</NavLink></li>}
              {sesion && <li className="nav-item"><button type="button" className="nav-link btn btn-link" onClick={async () => { await logout(); nav("/"); }}>Salir</button></li>}
            </ul>
            <button type="button" className="btn btn-dark rounded-pill px-3" onClick={() => { setAbierto(true); setMenu(false); }}>
              <i className="bi bi-bag me-1"></i> Mi reserva <span className="badge text-bg-light ms-1" id="contadorCarrito">{items.length}</span>
            </button>
          </div>
        </div>
      </nav>
      <Outlet />
      <footer className="py-4" id="contacto"><div className="container d-flex justify-content-between align-items-center gap-3"><Link className="navbar-brand d-flex align-items-center gap-2 fw-bold text-white" to="/"><span className="brand-mark"><i className="bi bi-controller"></i></span>JuegaYa</Link><div className="d-flex gap-3"><a href="#" aria-label="Instagram"><i className="bi bi-instagram"></i></a><a href="#" aria-label="WhatsApp"><i className="bi bi-whatsapp"></i></a></div></div></footer>
      <CartDrawer />
    </>
  );
}
