-- Permite varios presupuestos por categoría (ej. Netflix + Spotify en Suscripciones)
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS title TEXT;

UPDATE budgets b
SET title = c.name
FROM categories c
WHERE (b.title IS NULL OR b.title = '') AND b.category_id = c.id;

UPDATE budgets SET title = 'Presupuesto' WHERE title IS NULL OR title = '';

ALTER TABLE budgets ALTER COLUMN title SET NOT NULL;

ALTER TABLE budgets DROP CONSTRAINT IF EXISTS budgets_category_id_month_user_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS budgets_user_month_title_unique
  ON budgets (user_id, month, title);

DROP VIEW IF EXISTS budgets_with_spent;

CREATE VIEW budgets_with_spent AS
WITH category_spent AS (
  SELECT
    b.user_id,
    b.month,
    b.category_id,
    COALESCE(SUM(t.amount), 0) AS total_spent
  FROM budgets b
  LEFT JOIN transactions t
    ON t.category_id = b.category_id
    AND t.user_id = b.user_id
    AND t.type = 'expense'
    AND TO_CHAR(t.date, 'YYYY-MM') = b.month
  GROUP BY b.user_id, b.month, b.category_id
),
category_limits AS (
  SELECT user_id, month, category_id, SUM(limit_amount) AS total_limit
  FROM budgets
  GROUP BY user_id, month, category_id
)
SELECT
  b.id,
  b.title,
  b.category_id,
  b.month,
  b.limit_amount,
  b.user_id,
  c.name AS category_name,
  c.icon AS category_icon,
  c.color AS category_color,
  CASE
    WHEN cl.total_limit > 0
    THEN ROUND((cs.total_spent * (b.limit_amount / cl.total_limit))::numeric, 2)
    ELSE 0
  END AS spent,
  CASE
    WHEN b.limit_amount > 0
    THEN ROUND(
      (
        CASE
          WHEN cl.total_limit > 0
          THEN cs.total_spent * (b.limit_amount / cl.total_limit)
          ELSE 0
        END / b.limit_amount
      ) * 100, 1)
    ELSE 0
  END AS percentage
FROM budgets b
LEFT JOIN categories c ON c.id = b.category_id
LEFT JOIN category_spent cs
  ON cs.user_id = b.user_id AND cs.month = b.month AND cs.category_id = b.category_id
LEFT JOIN category_limits cl
  ON cl.user_id = b.user_id AND cl.month = b.month AND cl.category_id = b.category_id;
