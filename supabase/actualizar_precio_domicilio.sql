-- ═══════════════════════════════════════════════════════════════
-- Cambia el desayuno a domicilio de $7.000 a $6.000 (quita el
-- recargo de $1.000 que se sumaba encima del precio base).
-- ═══════════════════════════════════════════════════════════════
-- Pega TODO este archivo en el SQL Editor de Supabase y dale Run.
-- ═══════════════════════════════════════════════════════════════

update configuracion_reservas set valor_domicilio_adicional = 0 where id = 1;

select * from configuracion_reservas where id = 1;
