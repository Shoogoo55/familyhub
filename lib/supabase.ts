import { createClient } from "@supabase/supabase-js";
import type {
  ShoppingItem,
  ShoppingList,
  MealPlan,
  Recipe,
  Todo,
  Household,
} from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      households: { Row: Household };
      shopping_lists: { Row: ShoppingList };
      shopping_items: { Row: ShoppingItem };
      meal_plans: { Row: MealPlan };
      recipes: { Row: Recipe };
      todos: { Row: Todo };
    };
  };
};

// Household ID – stored in localStorage for simplicity (no auth required)
export const HOUSEHOLD_KEY = "familyhub_household_id";

export function getHouseholdId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(HOUSEHOLD_KEY);
}

export function setHouseholdId(id: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(HOUSEHOLD_KEY, id);
}
