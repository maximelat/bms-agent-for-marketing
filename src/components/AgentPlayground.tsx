"use client";

import { useMemo, useState } from "react";
import { Send, Loader2, Sparkles, Copy } from "lucide-react";
import { defaultStructuredNeed, StructuredNeed } from "@/lib/structuredNeed";
import { AgentPhase } from "@/lib/agentPrompt";
import { mergeStructuredNeed } from "@/lib/mergeStructuredNeed";
import { SummaryPanel } from "./SummaryPanel";
import { cn } from "@/lib/utils";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const phaseLabels: Record<AgentPhase, string> = {
  contexte: "Découverte",
  "pain-points": "Douleurs",
  donnees: "Cartographie données",
  copilot: "Idées Copilot",
  "automation-avancee": "Cas idéaux",
  normalisation: "Normalisation",
};

const initialAssistantMessage =
  "Bonjour, je suis Helios. Prenons 15 minutes pour cartographier votre quotidien de chef·fe de produit marketing chez BMS. Pour commencer, décrivez votre rôle, les marchés couverts et les jalons critiques de vos semaines ?";

export const AgentPlayground = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: initialAssistantMessage },
  ]);
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<AgentPhase>("contexte");
  const [status, setStatus] = useState<"collect" | "ready">("collect");
  const [structuredNeed, setStructuredNeed] = useState<StructuredNeed>(defaultStructuredNeed);
  const [loading, setLoading] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [agentVersion, setAgentVersion] = useState<"v1" | "v2">("v1");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [previousResponseId, setPreviousResponseId] = useState<string | null>(null);

  const canFinalize = status === "ready" && structuredNeed.copilotOpportunities.length > 0;
  const emailIsValid = /\S+@\S+\.\S+/.test(recipientEmail.trim());
  const canSendSummary = canFinalize && emailIsValid;

  const transcriptPayload = useMemo(
    () => messages.map((m) => ({ role: m.role, content: m.content })),
    [messages],
  );
  const transcriptText = useMemo(
    () =>
      transcriptPayload
        .map((m, idx) => `${idx + 1}. ${m.role === "assistant" ? "Helios" : "Vous"} · ${m.content}`)
        .join("\n"),
    [transcriptPayload],
  );
  const copyTranscript = async () => {
    if (!transcriptText) return;
    try {
      await navigator.clipboard.writeText(transcriptText);
      setFeedback("Transcription copiée.");
    } catch (error) {
      console.error(error);
      setFeedback("Impossible de copier la transcription.");
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMessage: ChatMessage = { role: "user", content: input.trim() };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          phase,
          agentVersion,
          previousResponseId: previousResponseId ?? undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Erreur inconnue");
      }

      setMessages([...nextMessages, { role: "assistant", content: data.reply }]);
      setStructuredNeed((prev) => mergeStructuredNeed(prev, data.normalizedUpdate));
      setPhase(data.phase as AgentPhase);
      setStatus(data.status === "ready" ? "ready" : "collect");
      setPreviousResponseId(data.responseId ?? null);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Je rencontre un incident technique. Veuillez contacter Maxime Latry ou réessayez dans quelques secondes.",
        },
      ]);
      setFeedback("Erreur de dialogue, tentative suivante recommandée.");
      setPreviousResponseId(null);
    } finally {
      setLoading(false);
    }
  };

  const finalize = async () => {
    setFinalizing(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          structuredNeed,
          transcript: transcriptPayload,
          recipientEmail: recipientEmail.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Échec de l'envoi");
      }
      setFeedback("Synthèse envoyée au webhook (n8n).");
    } catch (error) {
      console.error(error);
      setFeedback("Impossible d'envoyer la synthèse. Vérifiez le webhook n8n.");
    } finally {
      setFinalizing(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
      <section className="flex flex-col rounded-3xl border border-zinc-200 bg-white/90 p-6 shadow-lg">
        <header className="mb-5 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-white/70 p-1 text-xs font-semibold text-emerald-700">
            <button
              type="button"
              className={cn(
                "rounded-full px-3 py-1 transition",
                agentVersion === "v1" ? "bg-emerald-600 text-white" : "text-emerald-600",
              )}
              onClick={() => setAgentVersion("v1")}
            >
              Helios v1
            </button>
            <button
              type="button"
              className={cn(
                "rounded-full px-3 py-1 transition",
                agentVersion === "v2" ? "bg-emerald-600 text-white" : "text-emerald-600",
              )}
              onClick={() => setAgentVersion("v2")}
            >
              Helios v2 (trame formulaire)
            </button>
          </div>
          {Object.entries(phaseLabels).map(([key, label]) => (
            <span
              key={key}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold",
                phase === key ? "bg-emerald-600 text-white" : "bg-zinc-100 text-zinc-500",
              )}
            >
              {label}
            </span>
          ))}
        </header>

        <div
          className="flex-1 space-y-4 overflow-y-auto [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none" }}
        >
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "max-w-3xl rounded-2xl px-4 py-3 text-sm leading-relaxed",
                message.role === "assistant"
                  ? "bg-zinc-50 text-zinc-900"
                  : "ml-auto bg-emerald-600 text-white",
              )}
            >
              {message.content}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Helios réfléchit...
            </div>
          )}
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex items-end gap-2">
            <textarea
              className="min-h-[90px] flex-1 resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500"
              placeholder="Décrivez les tâches répétitives, les données manipulées, etc."
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
            />
            <button
              className="mb-1 rounded-2xl bg-emerald-600 p-3 text-white transition hover:bg-emerald-700 disabled:opacity-50"
              disabled={!input.trim() || loading}
              onClick={sendMessage}
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
            <span>Statut : {status === "ready" ? "Prêt pour synthèse" : "Collecte en cours"}</span>
            {feedback && <span className="text-amber-600">{feedback}</span>}
          </div>
          <div className="grid gap-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Email destinataire n8n
              <input
                type="email"
                className="mt-1 w-full rounded-2xl border border-zinc-200 px-4 py-2 text-sm outline-none focus:border-emerald-500"
                placeholder="prenom.nom@bms.com"
                value={recipientEmail}
                onChange={(event) => setRecipientEmail(event.target.value)}
                required
              />
            </label>
            {!emailIsValid && recipientEmail.length > 0 && (
              <p className="text-xs text-amber-600">Saisissez une adresse valide avant l’envoi.</p>
            )}
          </div>
          <button
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-600 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:border-zinc-200 disabled:text-zinc-400"
            disabled={!canSendSummary || finalizing}
            onClick={finalize}
          >
            {finalizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Générer la matrice & envoyer le compte-rendu
          </button>
        </div>
      </section>

      <div className="space-y-6">
        <SummaryPanel data={structuredNeed} phase={phaseLabels[phase]} />

        <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white/80 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-emerald-600">Transcription</p>
              <h3 className="text-lg font-semibold text-zinc-900">Fil de discussion</h3>
            </div>
            <button
              type="button"
              onClick={copyTranscript}
              disabled={!transcriptPayload.length}
              className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1 text-sm text-zinc-700 transition hover:border-emerald-500 hover:text-emerald-600 disabled:opacity-40"
            >
              <Copy className="h-4 w-4" />
              Copier
            </button>
          </div>
          <p className="text-xs text-zinc-500">
            Partagez ce fil si un participant rejoint en cours de route ou pour préparer la phase de normalisation.
          </p>
          <div className="h-48 overflow-y-auto rounded-xl border border-zinc-200 bg-white/90 p-3 text-sm text-zinc-700">
            {transcriptPayload.length === 0 ? (
              <p className="text-zinc-400">La transcription apparaîtra après vos premiers échanges.</p>
            ) : (
              <ul className="space-y-2">
                {transcriptPayload.map((entry, index) => (
                  <li key={`${entry.role}-${index}`}>
                    <span className="font-semibold text-emerald-700">
                      {entry.role === "assistant" ? "Helios" : "Vous"}
                    </span>
                    <span className="text-zinc-400"> · </span>
                    <span>{entry.content}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

