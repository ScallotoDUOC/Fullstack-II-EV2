import { defineConfig } from 'vite'

// El sitio tiene varias páginas HTML (no una sola como el tutorial), así que se listan todas.
// En desarrollo (npm run dev) Vite las sirve todas sin esta lista; solo hace falta para "npm run build".
export default defineConfig({
  server: { port: 5500 },
  preview: { port: 5500 },
  build: {
    rollupOptions: {
      input: {
        index: 'index.html',
        catalogo: 'catalogo.html',
        'detalle-producto': 'detalle-producto.html',
        'detalle-compra': 'detalle-compra.html',
        'mis-reservas': 'mis-reservas.html',
        'crear-cuenta': 'crear-cuenta.html',
        'iniciar-sesion': 'iniciar-sesion.html',
        admin: 'admin.html',
      },
    },
  },
})
