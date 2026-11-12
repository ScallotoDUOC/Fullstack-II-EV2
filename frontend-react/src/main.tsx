import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles.css";
import "./tailwind.css"; // Tailwind (con prefijo tw:) para los componentes shadcn/ui del panel
import "./catalogo.css";
import "./responsive.css"; // pie de página al fondo y vista de celular // estilos de tarjetas, carrito y hero que estaban dentro de catalogo.html

createRoot(document.getElementById("root")!).render(
  <StrictMode><BrowserRouter><App /></BrowserRouter></StrictMode>
);
