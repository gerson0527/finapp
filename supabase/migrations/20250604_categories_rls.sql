-- Políticas RLS para categorías (lectura global, CRUD para usuarios autenticados)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_select" ON categories;
DROP POLICY IF EXISTS "categories_insert" ON categories;
DROP POLICY IF EXISTS "categories_update" ON categories;
DROP POLICY IF EXISTS "categories_delete" ON categories;

CREATE POLICY "categories_select" ON categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "categories_insert" ON categories
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "categories_update" ON categories
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "categories_delete" ON categories
  FOR DELETE TO authenticated USING (true);
