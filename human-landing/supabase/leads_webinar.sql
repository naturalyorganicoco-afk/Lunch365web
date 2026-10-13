-- Tabla de registros al webinar "Seamos Rentables" (landing de pauta Meta).
-- Ejecutar en el SQL Editor del Supabase del CRM (capítulo 2.2).
-- Después, un trigger/función puede copiar cada fila a la tabla `leads` del CRM.

create table if not exists public.leads_webinar (
  id                   uuid primary key default gen_random_uuid(),
  created_at           timestamptz not null default now(),
  nombre               text not null,
  correo               text not null,
  whatsapp             text not null,
  perfil               text not null check (perfil in ('emprendedor','empresario')),
  webinar_fecha        timestamptz not null,
  consentimiento_datos boolean not null default false,
  variante_titular     text,                    -- 'a' o 'b' (prueba A/B del titular)
  event_id             text,
  utm_source text, utm_medium text, utm_campaign text, utm_content text, utm_term text, utm_id text,
  cid text, fbclid text, fbp text, fbc text,
  landing_url          text,
  asistio              boolean default false,   -- se marca tras el webinar
  grupo_whatsapp       boolean default false    -- entró al grupo para agendar consultoría
);

alter table public.leads_webinar enable row level security;

-- La landing (anon) SOLO puede insertar; nadie anónimo puede leer, editar ni borrar.
drop policy if exists "anon puede registrarse" on public.leads_webinar;
create policy "anon puede registrarse" on public.leads_webinar
  for insert to anon
  with check (consentimiento_datos = true);

-- La lectura queda para el rol autenticado del equipo (dashboard CRM).
drop policy if exists "equipo lee leads" on public.leads_webinar;
create policy "equipo lee leads" on public.leads_webinar
  for select to authenticated using (true);
