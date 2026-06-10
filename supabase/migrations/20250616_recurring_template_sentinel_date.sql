-- Las plantillas recurrentes no deben aparecer en consultas mensuales del historial
UPDATE transactions
SET date = '1970-01-01'
WHERE is_recurring = TRUE
  AND recurring_source_id IS NULL
  AND date <> '1970-01-01';
