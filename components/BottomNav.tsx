"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, CalendarDays, CheckSquare, Sparkles, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", icon: ShoppingCart, label: "Einkauf" },
  { href: "/meals", icon: CalendarDays, label: "Woche" },
  { href: "/todos", icon: CheckSquare, label: "Todos" },
  { href: "/ai", icon: Sparkles, label: "KI-Koch" },
  { href: "/deals", icon: Tag, label: "Angebote" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 nav-blur border-t border-sage-200/60 safe-bottom z-50">
      <div className="flex justify-around items-center max-w-2xl mx-auto px-2 pt-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all min-w-[56px]",
                isActive
                  ? "text-sage-700"
                  : "text-sage-400 hover:text-sage-600"
              )}
            >
              <div
                className={cn(
                  "p-1.5 rounded-xl transition-all",
                  isActive ? "bg-sage-100" : ""
                )}
              >
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.2 : 1.8}
                  className={cn(isActive ? "text-sage-600" : "text-sage-400")}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium leading-none",
                  isActive ? "text-sage-700" : "text-sage-400"
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
