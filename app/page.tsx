"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useHousehold } from "@/components/HouseholdProvider";
import type { ShoppingItem, ShoppingList, Category } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";
import { cn } from "@/lib/utils";
import PageHeader from "@/components/PageHeader";
import {
  Plus,
  Trash2,
  ChevronDown,
  Check,
  ShoppingBasket,
  Loader2,
} from "lucide-react";

export default function ShoppingPage() {
  const { householdId, loading: householdLoading } = useHousehold();
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState("");
  const [newCategory, setNewCategory] = useState<Category>("sonstiges");
  const [showAddForm, setShowAddForm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load lists
  useEffect(() => {
    if (!householdId) return;
    supabase
      .from("shopping_lists")
      .select("*")
      .eq("household_id", householdId)
      .order("created_at")
      .then(({ data }) => {
        if (data && data.length > 0) {
          setLists(data);
          setActiveListId(data[0].id);
        }
      });
  }, [householdId]);

  // Load items + realtime
  useEffect(() => {
    if (!activeListId) return;
    setLoading(true);

    supabase
      .from("shopping_items")
      .select("*")
      .eq("list_id", activeListId)
      .order("created_at")
      .then(({ data }) => {
        setItems(data ?? []);
        setLoading(false);
      });

    const channel = supabase
      .channel(`shopping_${activeListId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shopping_items", filter: `list_id=eq.${activeListId}` },
        () => {
          supabase
            .from("shopping_items")
            .select("*")
            .eq("list_id", activeListId)
            .order("created_at")
            .then(({ data }) => setItems(data ?? []));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeListId]);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItem.trim() || !householdId || !activeListId) return;

    const { data } = await supabase
      .from("shopping_items")
      .insert({
        household_id: householdId,
        list_id: activeListId,
        name: newItem.trim(),
        category: newCategory,
        checked: false,
        quantity: null,
        unit: null,
        note: null,
      })
      .select()
      .single();

    if (data) {
      setItems((prev) => [...prev, data]);
      setNewItem("");
      inputRef.current?.focus();
    }
  }

  async function toggleItem(id: string, checked: boolean) {
    await supabase
      .from("shopping_items")
      .update({ checked: !checked, updated_at: new Date().toISOString() })
      .eq("id", id);
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, checked: !checked } : i))
    );
  }

  async function deleteItem(id: string) {
    await supabase.from("shopping_items").delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  async function clearChecked() {
    const checkedIds = items.filter((i) => i.checked).map((i) => i.id);
    if (checkedIds.length === 0) return;
    await supabase.from("shopping_items").delete().in("id", checkedIds);
    setItems((prev) => prev.filter((i) => !i.checked));
  }

  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

  // Group unchecked by category
  const grouped = CATEGORIES.filter((c) =>
    unchecked.some((i) => i.category === c.value)
  ).map((c) => ({
    ...c,
    items: unchecked.filter((i) => i.category === c.value),
  }));

  if (householdLoading) return <LoadingSkeleton />;

  return (
    <div className="page-enter">
      <PageHeader
        title="Einkaufsliste"
        emoji="🛒"
        subtitle={`${unchecked.length} Artikel offen`}
        action={
          checked.length > 0 ? (
            <button onClick={clearChecked} className="btn-ghost text-sage-500 text-xs">
              Erledigt löschen
            </button>
          ) : null
        }
      />

      {/* List tabs */}
      {lists.length > 1 && (
        <div className="px-5 mb-3 flex gap-2 overflow-x-auto scrollbar-none">
          {lists.map((l) => (
            <button
              key={l.id}
              onClick={() => setActiveListId(l.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                activeListId === l.id
                  ? "bg-sage-500 text-white"
                  : "bg-sage-100 text-sage-600"
              )}
            >
              {l.name}
            </button>
          ))}
        </div>
      )}

      {/* Add form toggle */}
      <div className="px-5 mb-4">
        {!showAddForm ? (
          <button
            onClick={() => {
              setShowAddForm(true);
              setTimeout(() => inputRef.current?.focus(), 100);
            }}
            className="w-full flex items-center gap-3 bg-white border-2 border-dashed border-sage-200 rounded-2xl px-4 py-3 text-sage-400 hover:border-sage-400 hover:text-sage-500 transition-all"
          >
            <Plus size={18} />
            <span className="text-sm">Artikel hinzufügen...</span>
          </button>
        ) : (
          <form
            onSubmit={addItem}
            className="card p-4 space-y-3"
          >
            <input
              ref={inputRef}
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="z.B. Äpfel, Milch, Brot..."
              className="input-base"
              autoFocus
            />
            <div className="flex gap-2">
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as Category)}
                className="input-base flex-1 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.emoji} {c.label}
                  </option>
                ))}
              </select>
              <button type="submit" className="btn-primary px-5">
                <Plus size={18} />
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="btn-ghost"
              >
                ✕
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Items list */}
      <div className="px-5 space-y-4">
        {loading ? (
          <LoadingItems />
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {grouped.map((group) => (
              <div key={group.value}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">{group.emoji}</span>
                  <span className="text-xs font-semibold text-sage-500 uppercase tracking-wider">
                    {group.label}
                  </span>
                </div>
                <div className="card divide-y divide-sage-50">
                  {group.items.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      onToggle={() => toggleItem(item.id, item.checked)}
                      onDelete={() => deleteItem(item.id)}
                    />
                  ))}
                </div>
              </div>
            ))}

            {checked.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Check size={14} className="text-sage-400" />
                  <span className="text-xs font-semibold text-sage-400 uppercase tracking-wider">
                    Erledigt ({checked.length})
                  </span>
                </div>
                <div className="card divide-y divide-sage-50 opacity-60">
                  {checked.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      onToggle={() => toggleItem(item.id, item.checked)}
                      onDelete={() => deleteItem(item.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ItemRow({
  item,
  onToggle,
  onDelete,
}: {
  item: ShoppingItem;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const cat = CATEGORIES.find((c) => c.value === item.category);
  return (
    <div className="flex items-center gap-3 px-4 py-3 group">
      <button
        onClick={onToggle}
        className={cn(
          "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
          item.checked
            ? "bg-sage-500 border-sage-500"
            : "border-sage-300 hover:border-sage-500"
        )}
      >
        {item.checked && <Check size={12} className="text-white" strokeWidth={3} />}
      </button>
      <div className="flex-1 min-w-0">
        <span
          className={cn(
            "text-sm font-medium block truncate",
            item.checked ? "line-through text-sage-400" : "text-sage-900"
          )}
        >
          {item.name}
        </span>
        {item.quantity && (
          <span className="text-xs text-sage-400">
            {item.quantity} {item.unit}
          </span>
        )}
      </div>
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-rose-50 text-rose-400 transition-all"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <ShoppingBasket size={48} className="mx-auto text-sage-200 mb-4" />
      <p className="text-sage-400 text-sm">Deine Liste ist leer</p>
      <p className="text-sage-300 text-xs mt-1">Füge deinen ersten Artikel hinzu</p>
    </div>
  );
}

function LoadingItems() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="skeleton h-12 w-full" />
      ))}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="px-5 pt-14 space-y-4">
      <div className="skeleton h-8 w-40" />
      <div className="skeleton h-12 w-full" />
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-14 w-full" />
        ))}
      </div>
    </div>
  );
}
