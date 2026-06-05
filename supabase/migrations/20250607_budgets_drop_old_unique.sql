-- Quitar restricción vieja: solo 1 presupuesto por categoría/mes (impedía gym + netflix en Entretenimiento)
ALTER TABLE budgets DROP CONSTRAINT IF EXISTS budgets_category_id_month_key;
ALTER TABLE budgets DROP CONSTRAINT IF EXISTS budgets_category_id_month_user_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS budgets_user_month_title_unique
  ON budgets (user_id, month, title);
