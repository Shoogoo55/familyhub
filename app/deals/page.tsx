"use client";

import { useEffect, useState } from "react";
import { useHousehold } from "@/components/HouseholdProvider";
import { supabase } from "@/lib/supabase";
import type { SupermarketDeal } from "@/lib/types";
import { cn, formatPrice } from "@/lib/utils";
import PageHeader from "@/components/PageHeader";
import {
  Tag,
  Loader2,
  ShoppingCart,
  RefreshCw,
  Check,
  Store,
  Percent,
  Info,
} from "lucide-react";

type StoreFilter = "alle" | "rewe" | "lidl" | "aldi";

const STORE_CONFIG = {
  rewe: { label: "REWE", color: "bg-red-500", textColor: "text-red-600", bgLight: "bg-red-50", emoji: "🔴" },
  lidl: { label: "Lidl", color: "bg-blue-600", textColor: "text-blue-600", bgLight: "bg-blue-50", emoji: "🔵" },
  aldi: { label: "Aldi", color: "bg-sky-500", textColor: "text-sky-600", bgLight: "bg-sky-50", emoji: "🟦" },
};

export default function DealsPage() {
  const { householdId } = useHousehold();
  const [deals, setDeals] = useState<SupermarketDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeFilter, setStoreFilter] = useState<StoreFilter>("alle");
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  async function loadDeals(store?: StoreFilter) {
    setLoading(true);
    try {
      const url =
        store && store !== "alle" ? `/api/deals?store=${store}` : "/api/deals";
      const res = await fetch(url);
      const data = await res.json();
      setDeals(data.deals ?? []);
    } catch {
      setDeals([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDeals();
  }, []);

  async function addToShoppingList(deal: SupermarketDeal) {
    if (!householdId) return;

    const { data: listData } = await supabase
      .from("shopping_lists")
      .select("id")
      .eq("household_id", householdId)
      .limit(1)
      .single();

    if (!listData) return;

    await supabase.from("shopping_items").insert({
      household_id: householdId,
      list_id: listData.id,
      name: `${deal.name}${deal.description ? ` (${deal.description})` : ""}`,
      category: "sonstiges",
      checked: false,
      quantity: null,
      unit: null,
      note: deal.sale_price
        ? `Angebot: ${formatPrice(deal.sale_price)}${deal.discount_percent ? ` (-${deal.discount_percent}%)` : ""}`
        : null,
    });

    setAddedItems((prev) => new Set([...prev, deal.id]));
    setTimeout(() => {
      setAddedItems((prev) => {
        const next = new Set(prev);
        next.delete(deal.id);
        return next;
      });
    }, 2000);
  }

  function handleStoreFilter(store: StoreFilter) {
    setStoreFilter(store);
  }

  const filtered =
    storeFilter === "alle"
      ? deals
      : deals.filter((d) => d.store === storeFilter);

  const categorized = filtered.reduce<Record<string, SupermarketDeal[]>>(
    (acc, deal) => {
      const cat = deal.category ?? "Sonstiges";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(deal);
      return acc;
    },
    {}
  );

  return (
    <div className="page-enter">
      <PageHeader
        title="Angebote"
        emoji="🏷"
        subtitle="Aktuelle Angebote aus deiner Region"
        action={
          <button
            onClick={() => {
              setRefreshing(true);
              loadDeals(storeFilter);
            }}
            className={cn(
              "p-2 rounded-xl hover:bg-sage-100 transition-all",
              refreshing && "animate-spin"
            )}
          >
            <RefreshCw size={18} className="text-sage-500" />
          </button>
        }
      />

      {/* Info banner */}
      <div className="mx-5 mb-4 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
        <Info size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700">
          Angebote werden automatisch aktualisiert. Preise können je nach Markt abweichen.
        </p>
      </div>

      {/* Store filter */}
      <div className="px-5 mb-4 flex gap-2 overflow-x-auto">
        {(["alle", "rewe", "lidl", "aldi"] as StoreFilter[]).map((store) => (
          <button
            key={store}
            onClick={() => handleStoreFilter(store)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5",
              storeFilter === store
                ? "bg-sage-500 text-white"
                : "bg-sage-100 text-sage-600 hover:bg-sage-200"
            )}
          >
            {store !== "alle" && (
              <span className="text-xs">{STORE_CONFIG[store].emoji}</span>
            )}
            {store === "alle" ? "Alle Märkte" : STORE_CONFIG[store].label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-5 space-y-5">
        {loading ? (
          <LoadingDeals />
        ) : filtered.length === 0 ? (
          <EmptyDeals />
        ) : (
          Object.entries(categorized).map(([category, categoryDeals]) => (
            <div key={category}>
              <h3 className="text-xs font-semibold text-sage-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Tag size={11} />
                {category}
              </h3>
              <div className="space-y-2">
                {categoryDeals.map((deal) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    added={addedItems.has(deal.id)}
                    onAdd={() => addToShoppingList(deal)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Data source note */}
      <div className="px-5 py-6 text-center">
        <p className="text-xs text-sage-300">
          Daten werden stündlich aktualisiert · Keine Gewähr auf Aktualität
        </p>
      </div>
    </div>
  );
}

function DealCard({
  deal,
  added,
  onAdd,
}: {
  deal: SupermarketDeal;
  added: boolean;
  onAdd: () => void;
}) {
  const storeConfig = STORE_CONFIG[deal.store];

  return (
    <div className="card p-4 flex items-center gap-3">
      {/* Store badge */}
      <div
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-xs",
          storeConfig.color
        )}
      >
        {storeConfig.label.slice(0, 2)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-sage-900 truncate">
          {deal.name}
        </p>
        {deal.description && (
          <p className="text-xs text-sage-500 truncate">{deal.description}</p>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          {deal.sale_price !== null && (
            <span className="text-base font-bold text-sage-800">
              {formatPrice(deal.sale_price)}
            </span>
          )}
          {deal.original_price !== null && deal.sale_price !== null && (
            <span className="text-xs text-sage-400 line-through">
              {formatPrice(deal.original_price)}
            </span>
          )}
          {deal.discount_percent !== null && (
            <span className="flex items-center gap-0.5 text-xs font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full">
              <Percent size={9} />
              {deal.discount_percent}
            </span>
          )}
        </div>
        {deal.valid_until && (
          <p className="text-xs text-sage-400 mt-0.5">
            bis {new Date(deal.valid_until).toLocaleDateString("de-DE")}
          </p>
        )}
      </div>

      {/* Add button */}
      <button
        onClick={onAdd}
        disabled={added}
        className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all",
          added
            ? "bg-sage-500 text-white"
            : "bg-sage-50 hover:bg-sage-100 text-sage-500"
        )}
      >
        {added ? <Check size={16} strokeWidth={3} /> : <ShoppingCart size={16} />}
      </button>
    </div>
  );
}

function LoadingDeals() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="skeleton h-20 w-full rounded-2xl" />
      ))}
    </div>
  );
}

function EmptyDeals() {
  return (
    <div className="text-center py-16">
      <Store size={48} className="mx-auto text-sage-200 mb-4" />
      <p className="text-sage-400 text-sm">Keine Angebote gefunden</p>
    </div>
  );
}
