-- FamilyHub Database Schema
-- Führe dieses SQL in deinem Supabase SQL Editor aus

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────────
-- HOUSEHOLDS
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS households (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL DEFAULT 'Meine Familie',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────
-- SHOPPING LISTS
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shopping_lists (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id  UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name          TEXT NOT NULL DEFAULT 'Einkaufsliste',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────
-- SHOPPING ITEMS
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shopping_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id  UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  list_id       UUID REFERENCES shopping_lists(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  quantity      NUMERIC,
  unit          TEXT,
  category      TEXT NOT NULL DEFAULT 'sonstiges',
  checked       BOOLEAN NOT NULL DEFAULT FALSE,
  note          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shopping_items_list_id ON shopping_items(list_id);
CREATE INDEX IF NOT EXISTS idx_shopping_items_household ON shopping_items(household_id);

-- ─────────────────────────────────────────────────────────────────────
-- RECIPES
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recipes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id  UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  ingredients   JSONB NOT NULL DEFAULT '[]',
  instructions  JSONB NOT NULL DEFAULT '[]',
  prep_time     INTEGER,
  servings      INTEGER,
  season        TEXT[] DEFAULT ARRAY['ganzjährig'],
  tags          TEXT[] DEFAULT ARRAY[]::TEXT[],
  source        TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('ai', 'manual')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipes_household ON recipes(household_id);

-- ─────────────────────────────────────────────────────────────────────
-- MEAL PLANS
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meal_plans (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id  UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  date          DATE NOT NULL,
  meal_type     TEXT NOT NULL CHECK (meal_type IN ('frühstück', 'mittagessen', 'abendessen', 'snack')),
  recipe_id     UUID REFERENCES recipes(id) ON DELETE SET NULL,
  custom_meal   TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (household_id, date, meal_type)
);

CREATE INDEX IF NOT EXISTS idx_meal_plans_household_date ON meal_plans(household_id, date);

-- ─────────────────────────────────────────────────────────────────────
-- TODOS
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS todos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id  UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  done          BOOLEAN NOT NULL DEFAULT FALSE,
  priority      TEXT NOT NULL DEFAULT 'mittel' CHECK (priority IN ('hoch', 'mittel', 'niedrig')),
  due_date      DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_todos_household ON todos(household_id);

-- ─────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- Erlaubt allen Nutzern mit household_id Zugriff (kein Auth erforderlich)
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE households       ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists   ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans       ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos            ENABLE ROW LEVEL SECURITY;

-- Open policies (no auth – anyone with the household_id can access)
-- In production, replace with proper auth policies
CREATE POLICY "Allow all for households"      ON households      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for shopping_lists"  ON shopping_lists  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for shopping_items"  ON shopping_items  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for recipes"         ON recipes         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for meal_plans"      ON meal_plans      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for todos"           ON todos           FOR ALL USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────
-- REALTIME
-- ─────────────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE shopping_items;
ALTER PUBLICATION supabase_realtime ADD TABLE todos;
ALTER PUBLICATION supabase_realtime ADD TABLE meal_plans;
