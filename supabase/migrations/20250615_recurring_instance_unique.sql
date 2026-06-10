-- Evita instancias duplicadas del mismo gasto fijo en un mes
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_recurring_month_unique
  ON transactions (user_id, recurring_source_id, (TO_CHAR(date, 'YYYY-MM')))
  WHERE recurring_source_id IS NOT NULL;

-- Limpia instancias duplicadas: conserva la más antigua por plantilla y mes
DELETE FROM transactions dup
USING transactions keep
WHERE dup.recurring_source_id IS NOT NULL
  AND keep.recurring_source_id = dup.recurring_source_id
  AND keep.user_id = dup.user_id
  AND TO_CHAR(keep.date, 'YYYY-MM') = TO_CHAR(dup.date, 'YYYY-MM')
  AND keep.id < dup.id;
