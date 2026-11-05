# Frontend JuegaYa (Vite + TypeScript)

Mismo esquema que el tutorial `tutorialts_S3`: proyecto Vite, TypeScript en `src/`, módulos con `import`/`export`.

```
npm install
npm run dev       # http://localhost:5500
npm run build     # tsc (revisa tipos) + vite build -> dist/
```

- `src/api.ts`: llamadas a los microservicios a través del Gateway (`http://localhost:8080`). Para cambiarlo sin tocar código:
  `<script>window.JUEGAYA_API = { catalogo: "http://otro-host:8083" }</script>` antes del script del módulo.
- `src/app.ts`, `src/admin.ts`, `src/reservas.ts`: una por grupo de páginas (ver `../INSTRUCCIONES.md`).
- `src/basicos/` y `src/juegaya.ts` son ejercicios/modelos de apoyo: se revisan con `tsc` pero ninguna página los carga.
- Requiere los microservicios y el Gateway encendidos (`../INSTRUCCIONES.md`).
