import { useAdminDatos } from "../admin/useAdminDatos";
import DescuentosTab from "../components/admin/DescuentosTab";
import JuegosTab from "../components/admin/JuegosTab";
import PagosTab from "../components/admin/PagosTab";
import ReservasTab from "../components/admin/ReservasTab";
import ResumenTab from "../components/admin/ResumenTab";
import RespaldoTab from "../components/admin/RespaldoTab";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

const TABS = [["resumen", "Resumen"], ["juegos", "Juegos"], ["reservas", "Reservas"], ["pagos", "Pagos"], ["descuentos", "Descuentos"], ["respaldo", "Copia de datos"]] as const;

// Panel de administración: cada pestaña es un componente con una sola responsabilidad
export default function Admin() {
  const d = useAdminDatos();
  return (
    <main className="container py-5">
      <Tabs defaultValue="resumen">
        <div className="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3">
          <h1 className="h3 fw-bold mb-0">Panel de administración</h1>
          <Button variant="outline" size="sm" onClick={() => d.recargar()} disabled={d.cargando}><i className="bi bi-arrow-clockwise"></i>{d.cargando ? "Actualizando..." : "Actualizar"}</Button>
        </div>
        <TabsList aria-label="Secciones del panel">
          {TABS.map(([k, t]) => <TabsTrigger key={k} value={k}>{t}</TabsTrigger>)}
        </TabsList>
        {d.error && <div className="alert alert-danger mb-0">{d.error}</div>}
        <TabsContent value="resumen"><ResumenTab filas={d.filas} juegos={d.juegos} /></TabsContent>
        <TabsContent value="juegos"><JuegosTab juegos={d.juegos} filas={d.filas} recargar={d.recargar} /></TabsContent>
        <TabsContent value="reservas"><ReservasTab filas={d.filas} juegos={d.juegos} manuales={d.manuales} setManuales={d.setManuales} recargar={d.recargar} /></TabsContent>
        <TabsContent value="pagos"><PagosTab pedidos={d.pedidos} recargar={d.recargar} /></TabsContent>
        <TabsContent value="descuentos"><DescuentosTab /></TabsContent>
        <TabsContent value="respaldo"><RespaldoTab juegos={d.juegos} filas={d.filas} manuales={d.manuales} setManuales={d.setManuales} recargar={d.recargar} /></TabsContent>
      </Tabs>
    </main>
  );
}
