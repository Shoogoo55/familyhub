"use client";

import { useEffect, useState, createContext, useContext } from "react";
import { supabase, getHouseholdId, setHouseholdId } from "@/lib/supabase";

interface HouseholdContextType {
  householdId: string | null;
  loading: boolean;
}

const HouseholdContext = createContext<HouseholdContextType>({
  householdId: null,
  loading: true,
});

export function useHousehold() {
  return useContext(HouseholdContext);
}

export default function HouseholdProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [householdId, setHouseholdIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      let id = getHouseholdId();

      if (!id) {
        // Create a new household
        const { data, error } = await supabase
          .from("households")
          .insert({ name: "Meine Familie" })
          .select("id")
          .single();

        if (!error && data) {
          id = data.id;
          setHouseholdId(id!);

          // Create a default shopping list
          await supabase.from("shopping_lists").insert({
            household_id: id,
            name: "Einkaufsliste",
          });
        }
      }

      setHouseholdIdState(id);
      setLoading(false);
    }

    init();
  }, []);

  return (
    <HouseholdContext.Provider value={{ householdId, loading }}>
      {children}
    </HouseholdContext.Provider>
  );
}
