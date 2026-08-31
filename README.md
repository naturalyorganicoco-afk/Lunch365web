# Santa Elena Lunch365

Sitio web de reservas de Santa Elena Lunch365 (ghost kitchen "Cocina Oculta" / Desayunos Naturales), marca de Agroinversiones Industriales Santa Elena, Rivera, Huila.

## Stack

- Frontend: HTML + CSS + JavaScript vanilla en un solo archivo (`index.html`), sin framework ni proceso de build.
- PWA instalable: `manifest.json` + `sw.js` (service worker con cache offline).
- Backend/datos: [Supabase](https://supabase.com) (Postgres + Realtime). Ver esquema en `supabase/`.
- Librería externa: `@supabase/supabase-js` v2 vía CDN (jsDelivr).
- Hosting: Netlify.
- Contacto/ventas: WhatsApp Business.

La web es de **solo reservas**: lee el catálogo de menús (tabla `app_state`, escrita por una app administrativa aparte) y escribe sus propias reservas en las tablas `reservas_web`, `cupos_diarios` y `horarios_entrega`.

## Estructura

```
index.html          Sitio completo (HTML + CSS + JS inline)
manifest.json        Manifest de la PWA
sw.js                 Service worker (cache offline)
icon-192.png, icon-512.png, apple-touch-icon.png, logo-lunch365.png   Íconos y logo
menu-*.jpg            Fotos de menús usadas por el service worker / hero
supabase/             Esquema y migraciones SQL de Supabase
```

## Cómo correr localmente

Es un sitio estático sin build. Basta con servirlo con cualquier servidor estático, por ejemplo:

```bash
python3 -m http.server 8080
```

y abrir `http://localhost:8080`.

## Pendientes conocidos

- Punto de recogida sin configurar (`PUNTO_RECOGIDA` en `index.html`, línea ~735) — falta URL de Google Maps y foto.
- Pago online (Wompi) preparado en el esquema de Supabase (`metodo_pago = 'online'`, `wompi_reference`) pero no implementado en el frontend — hoy solo se usa "contra entrega".
- Las políticas RLS de Supabase en las tablas de reservas son de lectura/escritura pública (sin autenticación) — riesgo de seguridad conocido.

Ver el documento de contexto maestro del proyecto en Google Drive para más detalle.
