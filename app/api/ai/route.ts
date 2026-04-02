import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getCurrentSeason } from "@/lib/utils";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const SYSTEM_PROMPT = `Du bist ein freundlicher Familien-Kochassistent und Ernährungsberater für eine deutsche Familie.
Du hilfst dabei:
- Saisonale, gesunde Rezepte vorzuschlagen und zu erklären
- Ganze Wochenpläne zu erstellen (Frühstück, Mittagessen, Abendessen)
- Rezepte nach Zutaten zu filtern
- Einkaufslisten aus Rezepten zu erstellen
- Ernährungstipps zu geben

Antworte immer auf Deutsch. Sei freundlich, praktisch und familienbewusst.
Wenn du Rezepte vorschlägst, gib immer an:
- Zutatenliste mit Mengenangaben
- Schritt-für-Schritt Zubereitung
- Zubereitungszeit
- Portionen
- Ob es saisonal passt

Aktuelle Jahreszeit: ${getCurrentSeason()}
Aktuelles Datum: ${new Date().toLocaleDateString("de-DE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}

Wenn du einen strukturierten Wochenplan erstellst, formatiere ihn klar mit Tagen und Mahlzeiten.
Wenn du ein Rezept im JSON-Format zurückgeben sollst (für das Speichern), antworte mit einem JSON-Objekt im Format:
{
  "name": "...",
  "description": "...",
  "ingredients": [{"name": "...", "amount": "..."}],
  "instructions": ["Schritt 1...", "Schritt 2..."],
  "prep_time": 30,
  "servings": 4,
  "season": ["frühling", "sommer", "herbst", "winter", "ganzjährig"],
  "tags": ["vegetarisch", "schnell", "familienfreundlich"]
}`;

export async function POST(req: NextRequest) {
  try {
    const { messages, action } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
    }

    // For week plan generation
    let userMessages = messages;
    if (action === "week_plan") {
      userMessages = [
        ...messages,
        {
          role: "user",
          content: `Erstelle mir bitte einen vollständigen Wochenplan für diese Woche mit Frühstück, Mittagessen und Abendessen für jeden Tag.
          Berücksichtige die aktuelle Jahreszeit (${getCurrentSeason()}) und verwende saisonale, gesunde Zutaten.
          Mache ihn abwechslungsreich und familienfreundlich.`,
        },
      ];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stream = await (client.messages.stream as any)({
      model: "claude-opus-4-5",
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages: userMessages,
      thinking: { type: "enabled", budget_tokens: 10000 },
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
            );
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("AI route error:", error);
    return NextResponse.json(
      { error: "Fehler beim Verarbeiten der Anfrage" },
      { status: 500 }
    );
  }
}

// Recipe extraction endpoint
export async function PUT(req: NextRequest) {
  try {
    const { text } = await req.json();

    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `Extrahiere das folgende Rezept in ein strukturiertes JSON-Format.
          Gib NUR das JSON zurück, kein anderer Text.

          Rezept-Text:
          ${text}

          Format:
          {
            "name": "Rezeptname",
            "description": "Kurze Beschreibung",
            "ingredients": [{"name": "Zutat", "amount": "Menge"}],
            "instructions": ["Schritt 1", "Schritt 2"],
            "prep_time": 30,
            "servings": 4,
            "season": ["ganzjährig"],
            "tags": ["tag1", "tag2"]
          }`,
        },
      ],
    });

    const content = response.content.find((b) => b.type === "text");
    if (!content || content.type !== "text") {
      throw new Error("No text content");
    }

    // Extract JSON from the response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");

    const recipe = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ recipe });
  } catch (error) {
    console.error("Recipe extraction error:", error);
    return NextResponse.json(
      { error: "Fehler beim Extrahieren des Rezepts" },
      { status: 500 }
    );
  }
}
