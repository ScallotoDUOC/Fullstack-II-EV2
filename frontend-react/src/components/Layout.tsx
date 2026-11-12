import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/Auth";
import { useCart } from "../context/Cart";
import { useAviso } from "../context/Toast";
import CartDrawer from "./CartDrawer";

export default function Layout() {
  const [menu, setMenu] = useState(false);
  const [perfilAbierto, setPerfilAbierto] = useState(false);
  const perfilRef = useRef<HTMLLIElement>(null);
  const { sesion, logout } = useAuth();
  const { items, setAbierto } = useCart();
  const nav = useNavigate();
  const aviso = useAviso();
  const cls = ({ isActive }: { isActive: boolean }) => `nav-link${isActive ? " active" : ""}`;

  // El menú del perfil se cierra al hacer clic fuera o con Escape
  useEffect(() => {
    if (!perfilAbierto) return;
    const fuera = (e: MouseEvent) => { if (perfilRef.current && !perfilRef.current.contains(e.target as Node)) setPerfilAbierto(false); };
    const tecla = (e: KeyboardEvent) => { if (e.key === "Escape") setPerfilAbierto(false); };
    document.addEventListener("mousedown", fuera); document.addEventListener("keydown", tecla);
    return () => { document.removeEventListener("mousedown", fuera); document.removeEventListener("keydown", tecla); };
  }, [perfilAbierto]);

  const cerrarSesion = async () => { setPerfilAbierto(false); setMenu(false); await logout(); aviso("Sesión cerrada"); nav("/"); };

  const abrirCarrito = () => { setAbierto(true); setMenu(false); };
  return (
    <div className="app-shell">
      <nav className="navbar navbar-expand-lg navbar-light bg-white sticky-top border-bottom">
        <div className="container py-2">
          <Link className="navbar-brand d-flex align-items-center gap-2 fw-bold" to="/">
            <span className="brand-mark"><i className="bi bi-controller"></i></span>JuegaYa
          </Link>
          {/* En el celular "Mi reserva" queda siempre a la vista, al lado de las 3 rayas, en vez de esconderse dentro del menú */}
          <div className="d-flex align-items-center gap-2 ms-auto d-lg-none">
            <button type="button" className="btn btn-dark rounded-pill px-3" id="btnReservaMovil" aria-label="Mi reserva" onClick={abrirCarrito}>
              <i className="bi bi-bag"></i> <span className="badge text-bg-light ms-1" id="contadorCarritoMovil">{items.length}</span>
            </button>
            <button className="navbar-toggler" type="button" aria-controls="menuPrincipal" aria-expanded={menu} aria-label="Abrir menú" onClick={() => setMenu(!menu)}>
              <span className="navbar-toggler-icon"></span>
            </button>
          </div>
          <div className={`collapse navbar-collapse${menu ? " show" : ""}`} id="menuPrincipal">
            <ul className="navbar-nav ms-auto me-lg-3 gap-lg-2 align-items-lg-center">
              {sesion && (
                <li className={`nav-item dropdown${perfilAbierto ? " show" : ""}`} ref={perfilRef}>
                  <button type="button" className="nav-link btn btn-link dropdown-toggle fw-semibold" id="btnPerfil" aria-expanded={perfilAbierto} aria-haspopup="true" onClick={() => setPerfilAbierto(!perfilAbierto)}>
                    <i className="bi bi-person-circle me-1"></i>{sesion.nombre}
                  </button>
                  {perfilAbierto && <ul className="dropdown-menu show shadow-sm" aria-labelledby="btnPerfil">
                    <li><Link className="dropdown-item" to="/perfil" onClick={() => { setPerfilAbierto(false); setMenu(false); }}><i className="bi bi-person-lines-fill me-2"></i>Ver mis datos</Link></li>
                    <li><hr className="dropdown-divider" /></li>
                    <li><button type="button" className="dropdown-item" id="btnCerrarSesion" onClick={cerrarSesion}><i className="bi bi-box-arrow-right me-2"></i>Cerrar sesión</button></li>
                  </ul>}
                </li>
              )}
              {!sesion && <li className="nav-item" onClick={() => setMenu(false)}><NavLink className={cls} to="/iniciar-sesion">Iniciar sesión</NavLink></li>}
              {!sesion && <li className="nav-item" onClick={() => setMenu(false)}><NavLink className={cls} to="/crear-cuenta">Crear cuenta</NavLink></li>}
              <li className="nav-item" onClick={() => setMenu(false)}><NavLink className={cls} to="/catalogo">Catálogo</NavLink></li>
              <li className="nav-item" onClick={() => setMenu(false)}><NavLink className={cls} to="/mis-reservas">Mis reservas</NavLink></li>
              <li className="nav-item" onClick={() => setMenu(false)}><a className="nav-link" href="#contacto">Contacto</a></li>
              {sesion?.rol === "ADMINISTRADOR" && <li className="nav-item" onClick={() => setMenu(false)}><NavLink className={cls} to="/admin">Admin</NavLink></li>}
            </ul>
            <button type="button" className="btn btn-dark rounded-pill px-3 d-none d-lg-inline-block" onClick={abrirCarrito}>
              <i className="bi bi-bag me-1"></i> Mi reserva <span className="badge text-bg-light ms-1" id="contadorCarrito">{items.length}</span>
            </button>
          </div>
        </div>
      </nav>
      <Outlet />
      <footer className="py-4" id="contacto"><div className="container d-flex justify-content-between align-items-center gap-3"><Link className="navbar-brand d-flex align-items-center gap-2 fw-bold text-white" to="/"><span className="brand-mark"><i className="bi bi-controller"></i></span>JuegaYa</Link><div className="d-flex gap-3"><a href="#" aria-label="Instagram"><i className="bi bi-instagram"></i></a><a href="#" aria-label="WhatsApp"><i className="bi bi-whatsapp"></i></a></div></div></footer>
      <CartDrawer />
    </div>
  );
}
