export type Category =
  | "obst-gemüse"
  | "milch-käse"
  | "fleisch-fisch"
  | "brot-backwaren"
  | "tiefkühl"
  | "getränke"
  | "snacks"
  | "haushalt"
  | "körperpflege"
  | "sonstiges";

export const CATEGORIES: { value: Category; label: string; emoji: string }[] =
  [
    { value: "obst-gemüse", label: "Obst & Gemüse", emoji: "🥦" },
    { value: "milch-käse", label: "Milch & Käse", emoji: "🧀" },
    { value: "fleisch-fisch", label: "Fleisch & Fisch", emoji: "🥩" },
    { value: "brot-backwaren", label: "Brot & Backwaren", emoji: "🍞" },
    { value: "tiefkühl", label: "Tiefkühl", emoji: "🧊" },
    { value: "getränke", label: "Getränke", emoji: "🥤" },
    { value: "snacks", label: "Snacks", emoji: "🍿" },
    { value: "haushalt", label: "Haushalt", emoji: "🧹" },
    { value: "körperpflege", label: "Körperpflege", emoji: "🧴" },
    { value: "sonstiges", label: "Sonstiges", emoji: "🛒" },
  ];

export interface ShoppingItem {
  id: string;
  household_id: string;
  list_id: string | null;
  name: string;
  quantity: number | null;
  unit: string | null;
  category: Category;
  checked: boolean;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShoppingList {
  id: string;
  household_id: string;
  name: string;
  created_at: string;
}

export type MealType = "frühstück" | "mittagessen" | "abendessen" | "snack";

export const MEAL_TYPES: { value: MealType; label: string; emoji: string }[] =
  [
    { value: "frühstück", label: "Frühstück", emoji: "🌅" },
    { value: "mittagessen", label: "Mittagessen", emoji: "☀️" },
    { value: "abendessen", label: "Abendessen", emoji: "🌙" },
    { value: "snack", label: "Snack", emoji: "🍎" },
  ];

export type Season = "frühling" | "sommer" | "herbst" | "winter" | "ganzjährig";

export interface Recipe {
  id: string;
  household_id: string;
  name: string;
  description: string | null;
  ingredients: { name: string; amount: string }[];
  instructions: string[];
  prep_time: number | null;
  servings: number | null;
  season: Season[];
  tags: string[];
  source: "ai" | "manual";
  created_at: string;
}

export interface MealPlan {
  id: string;
  household_id: string;
  date: string;
  meal_type: MealType;
  recipe_id: string | null;
  recipe?: Recipe;
  custom_meal: string | null;
  notes: string | null;
  created_at: string;
}

export type Priority = "hoch" | "mittel" | "niedrig";

export const PRIORITIES: {
  value: Priority;
  label: string;
  color: string;
}[] = [
  { value: "hoch", label: "Hoch", color: "text-rose-600 bg-rose-50" },
  { value: "mittel", label: "Mittel", color: "text-amber-600 bg-amber-50" },
  { value: "niedrig", label: "Niedrig", color: "text-sage-600 bg-sage-50" },
];

export interface Todo {
  id: string;
  household_id: string;
  title: string;
  description: string | null;
  done: boolean;
  priority: Priority;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Household {
  id: string;
  name: string;
  created_at: string;
}

export interface AIChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface SupermarketDeal {
  id: string;
  store: "rewe" | "lidl" | "aldi";
  name: string;
  description: string | null;
  original_price: number | null;
  sale_price: number | null;
  discount_percent: number | null;
  image_url: string | null;
  valid_from: string | null;
  valid_until: string | null;
  category: string | null;
}
