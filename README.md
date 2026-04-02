# FamilyHub 🏠

Eine schlanke Familien-App für Einkaufslisten, Wochenplanung, Todos und KI-Rezeptvorschläge — synchronisiert auf allen Geräten.

## Features

- 🛒 **Einkaufslisten** — nach Kategorien sortiert, Realtime-Sync
- 🗓 **Wochenplan** — Mahlzeiten planen, Rezepte zuordnen
- ✅ **Todos** — mit Priorität & Fälligkeitsdatum
- ✨ **KI-Kochassistent** — saisonale Rezepte via Claude Opus 4.6
- 🏷 **Angebote** — REWE, Lidl & Aldi Wochenangebote
- 📱 **PWA** — auf iPhone & Mac als App installierbar

---

## Setup

### 1. Abhängigkeiten installieren

```bash
cd APP
npm install
```

### 2. Supabase einrichten

1. Neues Projekt auf [supabase.com](https://supabase.com) anlegen
2. Im SQL Editor `supabase/schema.sql` ausführen
3. Unter **Settings → API** die URL und den Anon-Key kopieren

### 3. Umgebungsvariablen

```bash
cp .env.local.example .env.local
```

`.env.local` befüllen:

```env
NEXT_PUBLIC_SUPABASE_URL=https://DEIN_PROJEKT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=dein_anon_key
ANTHROPIC_API_KEY=sk-ant-...
```

### 4. App starten

```bash
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000)

---

## Sync auf iPhone & Mac

Die App ist eine **Progressive Web App (PWA)** und funktioniert in jedem Browser.

### iPhone (Safari)
1. App im Safari öffnen
2. Teilen-Button → **"Zum Home-Bildschirm"**
3. App erscheint wie eine native App

### Mac
1. In Safari oder Chrome öffnen
2. Adressleiste → Installieren-Icon klicken
3. Oder: Lesezeichen / Favoriten anlegen

### Sync
Alle Änderungen werden über **Supabase Realtime** sofort auf allen Geräten synchronisiert. Die `household_id` wird beim ersten Start erstellt und im localStorage gespeichert.

> **Tipp:** Um die gleiche household_id auf allen Geräten zu nutzen, öffne die App einmal auf Gerät 1, kopiere die ID aus den Browser DevTools (`localStorage.getItem('familyhub_household_id')`) und setze sie auf den anderen Geräten manuell (`localStorage.setItem('familyhub_household_id', 'DEINE_ID')`).

---

## Supermarkt-Angebote

| Markt | Quelle |
|-------|--------|
| **REWE** | Inoffizielle Mobile-API (automatisch, stündlich) |
| **Lidl** | Wöchentlich aktualisierte Fallback-Daten |
| **Aldi** | Wöchentlich aktualisierte Fallback-Daten |

Für offizielle Daten-APIs gibt es keine öffentliche Dokumentation. Die Angebote sind als Beispiele hinterlegt und können in `app/api/deals/route.ts` angepasst werden.

---

## Technologie

- **Next.js 15** (App Router, Server Components)
- **Supabase** (PostgreSQL + Realtime)
- **Tailwind CSS** (schlichte, grüne Ästhetik)
- **Claude Opus 4.6** (Adaptive Thinking, Streaming)

---

## KI-Funktionen

Der Kochassistent nutzt **Claude Opus 4.6** mit Adaptive Thinking und Streaming:

- Saisonale Rezeptvorschläge
- Komplette Wochenpläne generieren
- Rezepte aus Freitext extrahieren und speichern
- Fragen zu Ernährung & Kochen beantworten
- Zutaten automatisch zur Einkaufsliste hinzufügen
