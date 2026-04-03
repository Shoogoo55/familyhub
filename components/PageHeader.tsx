"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  emoji?: string;
  action?: React.ReactNode;
  className?: string;
  showSettings?: boolean;
}

export default function PageHeader({
  title,
  subtitle,
  emoji,
  action,
  className,
  showSettings = true,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "px-5 pt-14 pb-4 flex items-start justify-between",
        className
      )}
    >
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          {emoji && <span className="text-2xl">{emoji}</span>}
          <h1 className="text-2xl font-bold text-sage-900 tracking-tight">
            {title}
          </h1>
        </div>
        {subtitle && (
          <p className="text-sm text-sage-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-2 mt-1">
        {action && <div>{action}</div>}
        {showSettings && (
          <Link
            href="/settings"
            className="p-2 rounded-xl text-sage-400 hover:text-sage-600 hover:bg-sage-50 transition-all"
            title="Familie teilen"
          >
            <Settings size={18} />
          </Link>
        )}
      </div>
    </header>
  );
}
