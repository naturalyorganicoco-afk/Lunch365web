/* Configuración de la landing "Seamos Rentables".
   Todo lo marcado como PENDIENTE se llena sin tocar app.js. */
window.HH_CONFIG = {
  // Webinar quincenal (2 al mes). Fecha de un webinar real; los siguientes salen
  // automáticamente cada CYCLE_DAYS días. PENDIENTE: confirmar la fecha real del primero.
  WEBINAR_ANCHOR: '2026-10-27T19:00:00-05:00', // 19:00 hora Colombia
  CYCLE_DAYS: 15,
  DURATION_MIN: 60,
  WEBINAR_TITLE: 'Seamos Rentables — Webinar Human Holding Colombia',

  // Meta Pixel. PENDIENTE: ID del Pixel (se crea con la cuenta de Meta Business, capítulo 2.1).
  META_PIXEL_ID: '',

  // Destino de los leads (Supabase del CRM, capítulo 2.2). PENDIENTE.
  // Tabla esperada: ver supabase/leads_webinar.sql. Usar SOLO la anon key (nunca la service key).
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',
  SUPABASE_TABLE: 'leads_webinar'
};
