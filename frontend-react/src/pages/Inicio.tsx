import { Link } from "react-router-dom";

export default function Inicio() {
  return (
    <main>
      <section className="hero-section">
        <div className="container py-5">
          <div className="row align-items-center g-5 py-lg-4">
            <div className="col-lg-7">
              <h1 className="display-3 fw-bold mt-3 mb-3">Encuentra, agenda<br />y celebra.</h1>
              <p className="lead text-secondary mb-4">Arrienda juegos para tu fiesta o evento en pocos pasos: crea tu cuenta, revisa el catálogo y arma tu reserva.</p>
              <div className="d-flex flex-wrap gap-3">
                <Link className="btn btn-primary btn-lg rounded-pill px-4" to="/catalogo">Ver catálogo <i className="bi bi-arrow-down-right ms-2"></i></Link>
                <Link className="btn btn-outline-dark btn-lg rounded-pill px-4" to="/crear-cuenta">Crear cuenta</Link>
              </div>
            </div>
            <div className="col-lg-5">
              <div className="availability-card shadow-lg">
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <div><small className="text-secondary">Bienvenido</small><h2 className="h4 mb-0">¿Por dónde partimos?</h2></div>
                  <span className="calendar-icon"><i className="bi bi-controller"></i></span>
                </div>
                <p className="text-secondary mb-4">Elige una opción para comenzar tu reserva.</p>
                <Link className="btn btn-dark w-100 btn-lg mb-2" to="/catalogo">Explorar catálogo</Link>
                <Link className="btn btn-outline-dark w-100" to="/iniciar-sesion">Ya tengo cuenta</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
