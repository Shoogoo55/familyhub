"use client";

import { useEffect, useState } from "react";
import { useHousehold } from "@/components/HouseholdProvider";
import { HOUSEHOLD_KEY } from "@/lib/supabase";
import { Copy, Check, Users, Link2, RefreshCw } from "lucide-react";

export default function SettingsPage() {
  const { householdId } = useHousehold();
  const [copied, setCopied] = useState(false);
  const [joined, setJoined] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    if (householdId) {
      setShareUrl(`${window.location.origin}?join=${householdId}`);
    }

    // Check if joining via URL param
    const params = new URLSearchParams(window.location.search);
    const joinId = params.get("join");
    if (joinId && joinId !== householdId) {
      localStorage.setItem(HOUSEHOLD_KEY, joinId);
      setJoined(true);
      // Reload to apply new household
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    }
  }, [householdId]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetHousehold = () => {
    if (confirm("Haushalt zurücksetzen? Du verlierst die Verbindung zu deiner Familie!")) {
      localStorage.removeItem(HOUSEHOLD_KEY);
      window.location.href = "/";
    }
  };

  if (joined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-6">
        <div className="text-5xl">🎉</div>
        <h2 className="text-xl font-bold text-sage-800">Erfolgreich verbunden!</h2>
        <p className="text-sage-600 text-center">Du wirst zur Einkaufsliste weitergeleitet...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="pt-4">
        <h1 className="text-2xl font-bold text-sage-800">Familie teilen</h1>
        <p className="text-sage-500 text-sm mt-1">Verbinde alle Geräte mit einem Haushalt</p>
      </div>

      {/* Share Section */}
      <div className="card space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sage-100 rounded-2xl flex items-center justify-center">
            <Users size={20} className="text-sage-600" />
          </div>
          <div>
            <h2 className="font-semibold text-sage-800">Haushalt teilen</h2>
            <p className="text-xs text-sage-500">Schick diesen Link an deine Frau</p>
          </div>
        </div>

        <div className="bg-sage-50 rounded-2xl p-3 flex items-center gap-2">
          <Link2 size={14} className="text-sage-400 shrink-0" />
          <span className="text-xs text-sage-600 flex-1 break-all leading-relaxed">
            {shareUrl || "Wird geladen..."}
          </span>
        </div>

        <button
          onClick={copyLink}
          className={`btn-primary w-full flex items-center justify-center gap-2 ${
            copied ? "bg-green-500" : ""
          }`}
        >
          {copied ? (
            <>
              <Check size={18} />
              Link kopiert!
            </>
          ) : (
            <>
              <Copy size={18} />
              Link kopieren
            </>
          )}
        </button>

        <p className="text-xs text-sage-400 text-center">
          Wenn deine Frau den Link öffnet, sind alle Daten automatisch synchronisiert ✓
        </p>
      </div>

      {/* How it works */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-sage-800">So funktioniert es</h2>
        <div className="space-y-2">
          {[
            { step: "1", text: "Kopiere den Link oben" },
            { step: "2", text: "Schick ihn per WhatsApp an deine Frau" },
            { step: "3", text: "Sie öffnet den Link in Safari" },
            { step: "4", text: "Alles ist sofort synchronisiert!" },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-center gap-3">
              <div className="w-6 h-6 bg-sage-100 rounded-full flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-sage-600">{step}</span>
              </div>
              <span className="text-sm text-sage-700">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Household ID */}
      <div className="card space-y-2">
        <h2 className="font-semibold text-sage-800">Haushalt-ID</h2>
        <p className="text-xs font-mono text-sage-400 break-all">{householdId || "Laden..."}</p>
      </div>

      {/* Reset */}
      <button
        onClick={resetHousehold}
        className="w-full flex items-center justify-center gap-2 p-3 text-sm text-red-400 hover:text-red-600 transition-colors"
      >
        <RefreshCw size={14} />
        Neuen Haushalt erstellen
      </button>
    </div>
  );
}
