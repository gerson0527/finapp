-- Evita instancias duplicadas del mismo gasto fijo en un mes (misma fecha de cargo)
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_recurring_month_unique
  ON transactions (user_id, recurring_source_id, date)
  WHERE recurring_source_id IS NOT NULL;

-- Limpia instancias duplicadas: conserva la más antigua por plantilla y fecha
DELETE FROM transactions dup
USING transactions keep
WHERE dup.recurring_source_id IS NOT NULL
  AND keep.recurring_source_id = dup.recurring_source_id
  AND keep.user_id = dup.user_id
  AND keep.date = dup.date
  AND keep.id < dup.id;
