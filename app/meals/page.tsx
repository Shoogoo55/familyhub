"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useHousehold } from "@/components/HouseholdProvider";
import type { MealPlan, MealType, Recipe } from "@/lib/types";
import { MEAL_TYPES } from "@/lib/types";
import {
  cn,
  getWeekDates,
  isoDate,
  GERMAN_DAYS,
  GERMAN_MONTHS,
} from "@/lib/utils";
import PageHeader from "@/components/PageHeader";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  BookOpen,
  Pencil,
  ShoppingCart,
  Utensils,
} from "lucide-react";
import Link from "next/link";

export default function MealsPage() {
  const { householdId } = useHousehold();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState<{
    date: string;
    mealType: MealType;
  } | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>("");
  const [customMeal, setCustomMeal] = useState("");
  const [viewRecipe, setViewRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    setWeekDates(getWeekDates(currentWeek));
  }, [currentWeek]);

  useEffect(() => {
    if (!householdId || weekDates.length === 0) return;
    setLoading(true);

    const from = isoDate(weekDates[0]);
    const to = isoDate(weekDates[6]);

    Promise.all([
      supabase
        .from("meal_plans")
        .select("*, recipe:recipes(*)")
        .eq("household_id", householdId)
        .gte("date", from)
        .lte("date", to)
        .order("date"),
      supabase
        .from("recipes")
        .select("*")
        .eq("household_id", householdId)
        .order("name"),
    ]).then(([plans, recs]) => {
      setMealPlans((plans.data as MealPlan[]) ?? []);
      setRecipes(recs.data ?? []);
      setLoading(false);
    });
  }, [householdId, weekDates]);

  function prevWeek() {
    const d = new Date(currentWeek);
    d.setDate(d.getDate() - 7);
    setCurrentWeek(d);
  }
  function nextWeek() {
    const d = new Date(currentWeek);
    d.setDate(d.getDate() + 7);
    setCurrentWeek(d);
  }

  async function saveMealPlan() {
    if (!householdId || !addModal) return;
    if (!customMeal.trim() && !selectedRecipeId) return;

    const existing = mealPlans.find(
      (p) => p.date === addModal.date && p.meal_type === addModal.mealType
    );

    const payload = {
      household_id: householdId,
      date: addModal.date,
      meal_type: addModal.mealType,
      recipe_id: selectedRecipeId || null,
      custom_meal: customMeal.trim() || null,
      notes: null,
    };

    if (existing) {
      const { data } = await supabase
        .from("meal_plans")
        .update(payload)
        .eq("id", existing.id)
        .select("*, recipe:recipes(*)")
        .single();
      if (data) {
        setMealPlans((prev) =>
          prev.map((p) => (p.id === existing.id ? (data as MealPlan) : p))
        );
      }
    } else {
      const { data } = await supabase
        .from("meal_plans")
        .insert(payload)
        .select("*, recipe:recipes(*)")
        .single();
      if (data) setMealPlans((prev) => [...prev, data as MealPlan]);
    }

    setAddModal(null);
    setCustomMeal("");
    setSelectedRecipeId("");
  }

  async function deleteMealPlan(id: string) {
    await supabase.from("meal_plans").delete().eq("id", id);
    setMealPlans((prev) => prev.filter((p) => p.id !== id));
  }

  async function addToShoppingList(recipe: Recipe) {
    if (!householdId) return;
    const { data: listData } = await supabase
      .from("shopping_lists")
      .select("id")
      .eq("household_id", householdId)
      .limit(1)
      .single();

    if (!listData) return;

    const items = recipe.ingredients.map((ing) => ({
      household_id: householdId,
      list_id: listData.id,
      name: ing.name,
      quantity: null,
      unit: ing.amount || null,
      category: "sonstiges" as const,
      checked: false,
      note: null,
    }));

    await supabase.from("shopping_items").insert(items);
    alert(`${recipe.ingredients.length} Zutaten zur Einkaufsliste hinzugefügt!`);
  }

  const today = isoDate(new Date());
  const weekLabel =
    weekDates.length > 0
      ? `${weekDates[0].getDate()}. ${GERMAN_MONTHS[weekDates[0].getMonth()].slice(0, 3)} – ${weekDates[6].getDate()}. ${GERMAN_MONTHS[weekDates[6].getMonth()].slice(0, 3)}`
      : "";

  return (
    <div className="page-enter">
      <PageHeader title="Wochenplan" emoji="🗓" />

      {/* Week nav */}
      <div className="px-5 mb-4 flex items-center justify-between">
        <button onClick={prevWeek} className="p-2 rounded-xl hover:bg-sage-100 transition-all">
          <ChevronLeft size={20} className="text-sage-600" />
        </button>
        <span className="text-sm font-semibold text-sage-700">{weekLabel}</span>
        <button onClick={nextWeek} className="p-2 rounded-xl hover:bg-sage-100 transition-all">
          <ChevronRight size={20} className="text-sage-600" />
        </button>
      </div>

      {/* Week grid */}
      <div className="px-5 space-y-2">
        {weekDates.map((date, idx) => {
          const dateStr = isoDate(date);
          const isToday = dateStr === today;
          const dayMeals = mealPlans.filter((p) => p.date === dateStr);

          return (
            <div
              key={dateStr}
              className={cn(
                "card p-4",
                isToday && "border-sage-400 ring-1 ring-sage-300"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                      isToday
                        ? "bg-sage-500 text-white"
                        : "text-sage-700"
                    )}
                  >
                    {date.getDate()}
                  </span>
                  <div>
                    <div className="text-xs font-semibold text-sage-700">
                      {GERMAN_DAYS[idx]}
                    </div>
                    {isToday && (
                      <div className="text-xs text-sage-400">Heute</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Meal slots */}
              <div className="space-y-1.5">
                {MEAL_TYPES.map((mt) => {
                  const meal = dayMeals.find(
                    (p) => p.meal_type === mt.value
                  );
                  return (
                    <MealSlot
                      key={mt.value}
                      mealType={mt}
                      meal={meal}
                      onAdd={() =>
                        setAddModal({ date: dateStr, mealType: mt.value })
                      }
                      onDelete={meal ? () => deleteMealPlan(meal.id) : undefined}
                      onViewRecipe={
                        meal?.recipe
                          ? () => setViewRecipe(meal.recipe!)
                          : undefined
                      }
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add meal modal */}
      {addModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end">
          <div className="bg-white w-full max-w-2xl mx-auto rounded-t-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sage-900">
                {MEAL_TYPES.find((m) => m.value === addModal.mealType)?.emoji}{" "}
                {MEAL_TYPES.find((m) => m.value === addModal.mealType)?.label}{" "}
                hinzufügen
              </h3>
              <button
                onClick={() => setAddModal(null)}
                className="p-2 rounded-xl hover:bg-sage-100"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-sage-500 uppercase tracking-wide mb-1.5 block">
                Aus gespeicherten Rezepten
              </label>
              <select
                value={selectedRecipeId}
                onChange={(e) => {
                  setSelectedRecipeId(e.target.value);
                  setCustomMeal("");
                }}
                className="input-base"
              >
                <option value="">-- Rezept wählen --</option>
                {recipes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-sage-100" />
              <span className="text-xs text-sage-400">oder</span>
              <div className="flex-1 h-px bg-sage-100" />
            </div>

            <div>
              <label className="text-xs font-semibold text-sage-500 uppercase tracking-wide mb-1.5 block">
                Freier Text
              </label>
              <input
                value={customMeal}
                onChange={(e) => {
                  setCustomMeal(e.target.value);
                  setSelectedRecipeId("");
                }}
                placeholder="z.B. Pizza Margherita"
                className="input-base"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setAddModal(null)}
                className="btn-ghost flex-1"
              >
                Abbrechen
              </button>
              <button onClick={saveMealPlan} className="btn-primary flex-1">
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recipe detail modal */}
      {viewRecipe && (
        <RecipeModal
          recipe={viewRecipe}
          onClose={() => setViewRecipe(null)}
          onAddToList={() => addToShoppingList(viewRecipe)}
        />
      )}
    </div>
  );
}

function MealSlot({
  mealType,
  meal,
  onAdd,
  onDelete,
  onViewRecipe,
}: {
  mealType: (typeof MEAL_TYPES)[0];
  meal?: MealPlan;
  onAdd: () => void;
  onDelete?: () => void;
  onViewRecipe?: () => void;
}) {
  return (
    <div className="flex items-center gap-2 group">
      <span className="text-sm w-5">{mealType.emoji}</span>
      {meal ? (
        <div className="flex-1 flex items-center justify-between bg-sage-50 rounded-xl px-3 py-2">
          <span className="text-sm text-sage-800 font-medium truncate">
            {meal.recipe?.name ?? meal.custom_meal}
          </span>
          <div className="flex items-center gap-1 ml-2">
            {onViewRecipe && (
              <button
                onClick={onViewRecipe}
                className="p-1 rounded-lg hover:bg-sage-200 text-sage-500"
              >
                <BookOpen size={12} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="p-1 rounded-lg hover:bg-rose-100 text-rose-400 opacity-0 group-hover:opacity-100"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={onAdd}
          className="flex-1 flex items-center gap-1.5 text-sage-300 hover:text-sage-500 text-xs py-1.5 px-3 rounded-xl hover:bg-sage-50 transition-all border border-dashed border-transparent hover:border-sage-200"
        >
          <Plus size={12} />
          <span>Hinzufügen</span>
        </button>
      )}
    </div>
  );
}

function RecipeModal({
  recipe,
  onClose,
  onAddToList,
}: {
  recipe: Recipe;
  onClose: () => void;
  onAddToList: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end">
      <div className="bg-white w-full max-w-2xl mx-auto rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-bold text-xl text-sage-900">{recipe.name}</h3>
            {recipe.prep_time && (
              <p className="text-sm text-sage-500 mt-0.5">
                ⏱ {recipe.prep_time} Min · 👤 {recipe.servings} Portionen
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-sage-100">
            <X size={18} />
          </button>
        </div>

        {recipe.description && (
          <p className="text-sm text-sage-600 mb-4">{recipe.description}</p>
        )}

        <div className="mb-4">
          <h4 className="font-semibold text-sage-800 mb-2 text-sm uppercase tracking-wide">
            Zutaten
          </h4>
          <div className="space-y-1">
            {recipe.ingredients.map((ing, i) => (
              <div key={i} className="flex gap-2 text-sm">
                <span className="text-sage-500 w-20 flex-shrink-0">
                  {ing.amount}
                </span>
                <span className="text-sage-800">{ing.name}</span>
              </div>
            ))}
          </div>
        </div>

        {recipe.instructions.length > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold text-sage-800 mb-2 text-sm uppercase tracking-wide">
              Zubereitung
            </h4>
            <ol className="space-y-2">
              {recipe.instructions.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="w-5 h-5 rounded-full bg-sage-100 text-sage-600 text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-semibold">
                    {i + 1}
                  </span>
                  <span className="text-sage-700">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        <button onClick={onAddToList} className="btn-primary w-full flex items-center justify-center gap-2">
          <ShoppingCart size={16} />
          Zutaten zur Einkaufsliste
        </button>
      </div>
    </div>
  );
}
