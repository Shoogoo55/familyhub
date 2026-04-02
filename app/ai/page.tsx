"use client";

import { useState, useRef, useEffect } from "react";
import { useHousehold } from "@/components/HouseholdProvider";
import { supabase } from "@/lib/supabase";
import type { AIChatMessage, Recipe } from "@/lib/types";
import { cn, getCurrentSeason } from "@/lib/utils";
import PageHeader from "@/components/PageHeader";
import {
  Send,
  Sparkles,
  Loader2,
  CalendarDays,
  ChefHat,
  ShoppingCart,
  Leaf,
  BookmarkPlus,
  User,
  Bot,
} from "lucide-react";

const SEASON_LABEL: Record<string, string> = {
  frühling: "Frühling",
  sommer: "Sommer",
  herbst: "Herbst",
  winter: "Winter",
};

const QUICK_PROMPTS = [
  {
    icon: CalendarDays,
    label: "Wochenplan erstellen",
    prompt:
      "Erstelle mir einen gesunden Wochenplan für diese Woche mit saisonalen Zutaten.",
  },
  {
    icon: Leaf,
    label: "Saisonales Rezept",
    prompt: `Was kann ich jetzt im ${SEASON_LABEL[getCurrentSeason()]} besonders frisch und regional kochen? Schlage 3 Rezepte vor.`,
  },
  {
    icon: ChefHat,
    label: "Schnelles Abendessen",
    prompt:
      "Ich brauche ein schnelles, gesundes Abendessen (max. 30 Min.) für 2-4 Personen. Was schlägst du vor?",
  },
  {
    icon: ShoppingCart,
    label: "Aus Vorräten kochen",
    prompt:
      "Ich habe folgendes zu Hause: Pasta, Tomaten, Zwiebeln, Knoblauch, Käse und Eier. Was kann ich daraus kochen?",
  },
];

export default function AIPage() {
  const { householdId } = useHousehold();
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [savingRecipe, setSavingRecipe] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function sendMessage(content: string) {
    if (!content.trim() || streaming) return;

    const userMessage: AIChatMessage = { role: "user", content: content.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setStreaming(true);

    // Add empty assistant message
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.ok) throw new Error("Request failed");
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                assistantText += parsed.text;
                setMessages((prev) => [
                  ...prev.slice(0, -1),
                  { role: "assistant", content: assistantText },
                ]);
              }
            } catch {}
          }
        }
      }
    } catch (error) {
      console.error("AI error:", error);
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role: "assistant",
          content:
            "Entschuldigung, es gab einen Fehler. Bitte versuche es erneut.",
        },
      ]);
    } finally {
      setStreaming(false);
    }
  }

  async function extractAndSaveRecipe(text: string) {
    if (!householdId) return;
    setSavingRecipe(true);
    try {
      const res = await fetch("/api/ai", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const { recipe } = await res.json();
      if (!recipe) throw new Error("No recipe extracted");

      const { error } = await supabase.from("recipes").insert({
        household_id: householdId,
        ...recipe,
        source: "ai",
      });

      if (!error) {
        alert(`✅ "${recipe.name}" wurde in deinen Rezepten gespeichert!`);
      } else {
        throw error;
      }
    } catch (e) {
      alert("Fehler beim Speichern des Rezepts.");
    } finally {
      setSavingRecipe(false);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const season = getCurrentSeason();

  return (
    <div className="page-enter flex flex-col h-screen">
      <PageHeader
        title="KI-Kochassistent"
        emoji="✨"
        subtitle={`Saison: ${SEASON_LABEL[season]} · Rezepte & Wochenplanung`}
      />

      {/* Chat area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-5 pb-4 space-y-4"
        style={{ maxHeight: "calc(100vh - 320px)" }}
      >
        {messages.length === 0 ? (
          <WelcomeScreen onPrompt={sendMessage} />
        ) : (
          messages.map((msg, i) => (
            <ChatBubble
              key={i}
              message={msg}
              isLast={i === messages.length - 1}
              streaming={streaming && i === messages.length - 1}
              onSaveRecipe={
                msg.role === "assistant" && !streaming
                  ? () => extractAndSaveRecipe(msg.content)
                  : undefined
              }
            />
          ))
        )}
        {streaming && messages[messages.length - 1]?.content === "" && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-sage-100 flex items-center justify-center flex-shrink-0">
              <Sparkles size={14} className="text-sage-500" />
            </div>
            <div className="card px-4 py-3">
              <TypingDots />
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="px-5 pb-4 pt-2 border-t border-sage-100 bg-sage-50/80">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Frag mich nach Rezepten, Wochenplänen..."
            className="input-base flex-1 resize-none min-h-[44px] max-h-32"
            rows={1}
            disabled={streaming}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || streaming}
            className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all",
              input.trim() && !streaming
                ? "bg-sage-500 hover:bg-sage-600 text-white"
                : "bg-sage-100 text-sage-300"
            )}
          >
            {streaming ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
        <p className="text-xs text-sage-400 mt-1.5 text-center">
          Enter zum Senden · Shift+Enter für neue Zeile
        </p>
      </div>
    </div>
  );
}

function WelcomeScreen({ onPrompt }: { onPrompt: (p: string) => void }) {
  return (
    <div className="py-4">
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-sage-100 flex items-center justify-center mx-auto mb-3">
          <ChefHat size={32} className="text-sage-500" />
        </div>
        <h2 className="font-bold text-sage-900 text-lg">Dein Kochassistent</h2>
        <p className="text-sm text-sage-500 mt-1">
          Ich helfe dir mit saisonalen Rezepten, Wochenplänen und mehr.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {QUICK_PROMPTS.map(({ icon: Icon, label, prompt }) => (
          <button
            key={label}
            onClick={() => onPrompt(prompt)}
            className="card px-3 py-4 text-left hover:border-sage-300 hover:shadow-soft transition-all group"
          >
            <Icon
              size={20}
              className="text-sage-400 group-hover:text-sage-600 mb-2 transition-colors"
            />
            <span className="text-sm font-medium text-sage-700">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ChatBubble({
  message,
  streaming,
  isLast,
  onSaveRecipe,
}: {
  message: AIChatMessage;
  streaming: boolean;
  isLast: boolean;
  onSaveRecipe?: () => void;
}) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end gap-2">
        <div className="bg-sage-500 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%]">
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-sage-200 flex items-center justify-center flex-shrink-0 mt-1">
          <User size={14} className="text-sage-600" />
        </div>
      </div>
    );
  }

  // Check if message contains a recipe-like content
  const hasRecipe =
    message.content.includes("Zutaten") &&
    message.content.includes("Zubereitung");

  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-sage-100 flex items-center justify-center flex-shrink-0 mt-1">
        <Sparkles size={14} className="text-sage-500" />
      </div>
      <div className="flex-1 max-w-[90%]">
        <div className="card px-4 py-3">
          <div className="text-sm text-sage-800 whitespace-pre-wrap prose-sm leading-relaxed">
            <FormattedText text={message.content} />
          </div>
          {streaming && isLast && <TypingCursor />}
        </div>
        {!streaming && onSaveRecipe && hasRecipe && (
          <button
            onClick={onSaveRecipe}
            className="mt-2 flex items-center gap-1.5 text-xs text-sage-500 hover:text-sage-700 transition-colors"
          >
            <BookmarkPlus size={13} />
            Als Rezept speichern
          </button>
        )}
      </div>
    </div>
  );
}

function FormattedText({ text }: { text: string }) {
  if (!text) return null;

  // Simple markdown-like formatting
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => {
        if (line.startsWith("### ")) {
          return (
            <h3 key={i} className="font-bold text-sage-900 mt-3 mb-1 text-base">
              {line.slice(4)}
            </h3>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <h2 key={i} className="font-bold text-sage-900 mt-4 mb-1.5 text-lg">
              {line.slice(3)}
            </h2>
          );
        }
        if (line.startsWith("**") && line.endsWith("**")) {
          return (
            <p key={i} className="font-semibold text-sage-900 mt-2">
              {line.slice(2, -2)}
            </p>
          );
        }
        if (line.startsWith("- ") || line.startsWith("• ")) {
          return (
            <p key={i} className="pl-3 text-sage-700">
              {line}
            </p>
          );
        }
        if (line.match(/^\d+\./)) {
          return (
            <p key={i} className="pl-3 text-sage-700 mt-0.5">
              {line}
            </p>
          );
        }
        if (line === "") return <div key={i} className="h-2" />;
        return (
          <p key={i} className="text-sage-700 leading-relaxed">
            {line}
          </p>
        );
      })}
    </>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full bg-sage-300 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

function TypingCursor() {
  return (
    <span className="inline-block w-0.5 h-4 bg-sage-400 ml-0.5 animate-pulse align-middle" />
  );
}
