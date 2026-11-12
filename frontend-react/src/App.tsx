import { Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/Auth";
import { CartProvider } from "./context/Cart";
import { ToastProvider } from "./context/Toast";
import Layout from "./components/Layout";
import Protegida from "./components/Protegida";
import Inicio from "./pages/Inicio";
import Catalogo from "./pages/Catalogo";
import DetalleProducto from "./pages/DetalleProducto";
import IniciarSesion from "./pages/IniciarSesion";
import CrearCuenta from "./pages/CrearCuenta";
import DetalleCompra from "./pages/DetalleCompra";
import MisReservas from "./pages/MisReservas";
import Admin from "./pages/Admin";
import Perfil from "./pages/Perfil";

export default function App() {
  return (
    <ToastProvider><AuthProvider><CartProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Inicio />} />
          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/producto/:id" element={<DetalleProducto />} />
          <Route path="/iniciar-sesion" element={<IniciarSesion />} />
          <Route path="/crear-cuenta" element={<CrearCuenta />} />
          <Route path="/detalle-compra" element={<Protegida><DetalleCompra /></Protegida>} />
          <Route path="/mis-reservas" element={<Protegida><MisReservas /></Protegida>} />
          <Route path="/perfil" element={<Protegida><Perfil /></Protegida>} />
          <Route path="/admin" element={<Protegida admin><Admin /></Protegida>} />
          <Route path="*" element={<main className="container py-5"><h1 className="h3">Página no encontrada</h1></main>} />
        </Route>
      </Routes>
    </CartProvider></AuthProvider></ToastProvider>
  );
}
