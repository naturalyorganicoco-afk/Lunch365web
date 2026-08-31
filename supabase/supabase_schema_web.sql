-- ═══════════════════════════════════════════════════════════════
-- Santa Elena Lunch365 — Esquema de reservas web (Fase 2)
-- Versión segura para volver a ejecutar (no falla si ya existe algo)
-- Se agrega al MISMO proyecto Supabase que ya usa la app administrativa
-- (misma SUPABASE_URL / ANON_KEY). No modifica ni toca la tabla app_state.
-- ══════════════════════════════════════════════════════════════
-- Pega TODO este archivo en el SQL Editor de Supabase y dale Run.
-- ══════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────
-- 1. Configuración general de reservas (una sola fila)
-- ───────────────────────────────────────────────────────────────
create table if not exists configuracion_reservas (
  id int primary key default 1,
  cupo_diario_default int not null default 100,
  valor_recogida numeric not null default 6000,
  valor_domicilio_adicional numeric not null default 1000,
  hora_corte time not null default '21:00',
  constraint configuracion_reservas_singleton check (id = 1)
);

insert into configuracion_reservas (id)
values (1)
on conflict (id) do nothing;

-- ───────────────────────────────────────────────────────────────
-- 2. Cupos por día (contador en vivo)
-- ───────────────────────────────────────────────────────────────
create table if not exists cupos_diarios (
  fecha date primary key,
  cupo_total int not null,
  cupo_disponible int not null,
  updated_at timestamptz not null default now()
);

-- ───────────────────────────────────────────────────────────────
-- 3. Reservas web (día suelto y planes semana/quincena/mes)
-- ───────────────────────────────────────────────────────────────
create table if not exists reservas_web (
  id uuid primary key default gen_random_uuid(),
  plan_grupo_id uuid,
  tipo_plan text not null check (tipo_plan in ('dia','semana','quincena','mes')),
  fecha date not null,
  menu_id text,
  menu_nombre text,
  nombre_cliente text not null,
  telefono text not null,
  modo_entrega text not null check (modo_entrega in ('recogida','domicilio')),
  direccion text,
  valor numeric not null,
  metodo_pago text not null check (metodo_pago in ('contra_entrega','online')),
  estado_pago text not null default 'pendiente' check (estado_pago in ('pendiente','pagado')),
  wompi_reference text,
  estado text not null default 'pendiente_revision' check (estado in ('pendiente_revision','aprobada','rechazada')),
  pedido_id_generado text,
  notas_gerencia text,
  creado_ts timestamptz not null default now()
);

create index if not exists idx_reservas_web_estado on reservas_web (estado);
create index if not exists idx_reservas_web_plan_grupo on reservas_web (plan_grupo_id);
create index if not exists idx_reservas_web_fecha on reservas_web (fecha);

-- ───────────────────────────────────────────────────────────────
-- 3.1 Carrito por reserva: cantidad de desayunos de esa línea, y
--     observación opcional que el cliente deja al finalizar su pedido.
--     (agregado en la fase de "carrito con varios menús y cantidades")
-- ───────────────────────────────────────────────────────────────
alter table reservas_web add column if not exists cantidad int not null default 1;
alter table reservas_web add column if not exists notas_cliente text;

-- ───────────────────────────────────────────────────────────────
-- 3.2 Horario de entrega: cada pedido a domicilio reserva un turno
--     de 4 minutos en la ruta de Rodrigo. La clave primaria
--     (fecha, hora) hace el bloqueo automático — si dos clientes
--     intentan el mismo minuto, el segundo INSERT falla solo.
-- ───────────────────────────────────────────────────────────────
alter table reservas_web add column if not exists hora_entrega text;

create table if not exists horarios_entrega (
  fecha date not null,
  hora text not null,
  plan_grupo_id uuid,
  nombre_cliente text,
  creado_ts timestamptz not null default now(),
  primary key (fecha, hora)
);

create index if not exists idx_horarios_entrega_fecha on horarios_entrega (fecha);

-- ───────────────────────────────────────────────────────────────
-- 4. Función atómica: reservar N cupos del día (evita condición de carrera)
--    Devuelve true si logró reservar los N cupos completos, false si no
--    alcanzaba (en ese caso no descuenta nada — todo o nada).
-- ───────────────────────────────────────────────────────────────
drop function if exists reservar_cupo(date);
create or replace function reservar_cupo(p_fecha date, p_cantidad int default 1)
returns boolean
language plpgsql
as $$
declare
  v_default int;
  v_filas_afectadas int;
begin
  select cupo_diario_default into v_default from configuracion_reservas where id = 1;

  insert into cupos_diarios (fecha, cupo_total, cupo_disponible)
  values (p_fecha, v_default, v_default)
  on conflict (fecha) do nothing;

  update cupos_diarios
  set cupo_disponible = cupo_disponible - p_cantidad,
      updated_at = now()
  where fecha = p_fecha
    and cupo_disponible >= p_cantidad;

  get diagnostics v_filas_afectadas = row_count;

  return v_filas_afectadas > 0;
end;
$$;

-- ───────────────────────────────────────────────────────────────
-- 5. Función: liberar N cupos del día (al rechazar una reserva de día suelto)
-- ───────────────────────────────────────────────────────────────
drop function if exists liberar_cupo(date);
create or replace function liberar_cupo(p_fecha date, p_cantidad int default 1)
returns void
language plpgsql
as $$
begin
  update cupos_diarios
  set cupo_disponible = least(cupo_total, cupo_disponible + p_cantidad),
      updated_at = now()
  where fecha = p_fecha;
end;
$$;

-- ───────────────────────────────────────────────────────────────
-- 6. Realtime — solo si no estaba habilitado ya
-- ───────────────────────────────────────────────────────────────
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'cupos_diarios'
  ) then
    alter publication supabase_realtime add table cupos_diarios;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'reservas_web'
  ) then
    alter publication supabase_realtime add table reservas_web;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'horarios_entrega'
  ) then
    alter publication supabase_realtime add table horarios_entrega;
  end if;
end $$;

-- ───────────────────────────────────────────────────────────────
-- 7. Seguridad a nivel de fila — mismo modelo que app_state:
--    esta app usa su propio sistema de PIN (no Supabase Auth), así
--    que se abre lectura/escritura con la llave pública "anon".
-- ───────────────────────────────────────────────────────────────
alter table configuracion_reservas enable row level security;
alter table cupos_diarios enable row level security;
alter table reservas_web enable row level security;
alter table horarios_entrega enable row level security;

drop policy if exists "Lectura publica config" on configuracion_reservas;
create policy "Lectura publica config" on configuracion_reservas for select using (true);

drop policy if exists "Lectura publica cupos" on cupos_diarios;
create policy "Lectura publica cupos" on cupos_diarios for select using (true);
drop policy if exists "Escritura publica cupos" on cupos_diarios;
create policy "Escritura publica cupos" on cupos_diarios for insert with check (true);
drop policy if exists "Actualizacion publica cupos" on cupos_diarios;
create policy "Actualizacion publica cupos" on cupos_diarios for update using (true);

drop policy if exists "Lectura publica reservas" on reservas_web;
create policy "Lectura publica reservas" on reservas_web for select using (true);
drop policy if exists "Escritura publica reservas" on reservas_web;
create policy "Escritura publica reservas" on reservas_web for insert with check (true);
drop policy if exists "Actualizacion publica reservas" on reservas_web;
create policy "Actualizacion publica reservas" on reservas_web for update using (true);

drop policy if exists "Lectura publica horarios" on horarios_entrega;
create policy "Lectura publica horarios" on horarios_entrega for select using (true);
drop policy if exists "Escritura publica horarios" on horarios_entrega;
create policy "Escritura publica horarios" on horarios_entrega for insert with check (true);
drop policy if exists "Borrado publico horarios" on horarios_entrega;
create policy "Borrado publico horarios" on horarios_entrega for delete using (true);

-- ───────────────────────────────────────────────────────────────
-- 8. Permisos de acceso a la API (grants) — igual que app_state,
--    obligatorios en Supabase desde 2026 además de las políticas.
-- ───────────────────────────────────────────────────────────────
grant usage on schema public to anon, authenticated;
grant select, insert, update on configuracion_reservas to anon, authenticated;
grant select, insert, update on cupos_diarios to anon, authenticated;
grant select, insert, update on reservas_web to anon, authenticated;
grant select, insert, delete on horarios_entrega to anon, authenticated;
grant execute on function reservar_cupo(date, int) to anon, authenticated;
grant execute on function liberar_cupo(date, int) to anon, authenticated;

-- Verificación rápida: políticas activas en las tablas nuevas
select tablename, policyname, cmd from pg_policies
where tablename in ('configuracion_reservas','cupos_diarios','reservas_web','horarios_entrega');
