"use client";

import { useMemo, useState, useRef } from "react";
import { Send, Loader2, Sparkles, Copy, Mic } from "lucide-react";
import { defaultStructuredNeed, StructuredNeed, FitLevel } from "@/lib/structuredNeed";
import { AgentPhase } from "@/lib/agentPrompt";
import { mergeStructuredNeed } from "@/lib/mergeStructuredNeed";
import { SummaryPanel } from "./SummaryPanel";
import { CanvasCard } from "./CanvasCard";
import { EditableCanvasCard } from "./EditableCanvasCard";
import { convertToCanvas } from "@/lib/convertToCanvas";
import { cn } from "@/lib/utils";
import { UseCaseCanvas } from "@/lib/useCaseCanvas";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const phaseLabels: Record<AgentPhase, string> = {
  contexte: "Découverte",
  "pain-points": "Douleurs",
  donnees: "Cartographie données",
  "copilot-lite": "Agents Copilot M365 Lite",
  "mon-ideal": "Mon idéal",
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
  const [agentVersion] = useState<"v1" | "v2">("v2");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [previousResponseId, setPreviousResponseId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isNormalizing, setIsNormalizing] = useState(false);
  const [normalizedCanvas, setNormalizedCanvas] = useState<any>(null);
  const sessionIdRef = useRef(`session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

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

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
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
    setTimeout(scrollToBottom, 50); // Scroll immédiatement après affichage du message user

    try {
      // Router via n8n webhook - envoyer uniquement le dernier message avec sessionId fixe
      const response = await fetch("/api/chat-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          phase,
          agentVersion,
          sessionId: sessionIdRef.current,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Erreur inconnue");
      }

      setMessages([...nextMessages, { role: "assistant", content: data.reply }]);
      
      // Mise à jour de la synthèse en parallèle
      if (data.normalizedUpdate) {
      setStructuredNeed((prev) => mergeStructuredNeed(prev, data.normalizedUpdate));
      }
      
      setPhase(data.phase as AgentPhase);
      const newStatus = data.status === "ready" ? "ready" : "collect";
      setStatus(newStatus);
      setPreviousResponseId(data.responseId ?? null);
      setTimeout(scrollToBottom, 100);

      // Normalisation automatique en arrière-plan si on a au moins 3 échanges
      if (nextMessages.length >= 6 && data.normalizedUpdate) {
        // Lancer la normalisation en parallèle (sans bloquer l'UI)
        fetch("/api/normalize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            structuredNeed: structuredNeed,
            transcript: transcriptPayload,
          }),
        })
          .then((res) => res.json())
          .then((normalizeData) => {
            if (normalizeData.normalizedNeed) {
              setStructuredNeed(normalizeData.normalizedNeed);
            }
          })
          .catch((error) => {
            console.error("normalisation background error", error);
          });
      }

      // Notification si status passe à "ready"
      if (newStatus === "ready" && status !== "ready") {
        setFeedback("✅ Analyse terminée ! Le rapport est prêt. Renseignez votre email pour l'envoyer.");
      }
    } catch (error) {
      console.error(error);
      
      // Vérifier si c'est une erreur HTML (504, 500...)
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("<!DOCTYPE") || errorMessage.includes("Unexpected token '<'")) {
        setFeedback("⚠️ Le serveur a mis trop de temps à répondre. Réessayez ou reformulez votre message.");
      } else {
        setFeedback("Erreur de dialogue, tentative suivante recommandée.");
      }
      
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Je rencontre un incident technique. Pouvez-vous reformuler votre dernière réponse de manière plus détaillée ?",
        },
      ]);
      setPreviousResponseId(null);
    } finally {
      setLoading(false);
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Détection du format audio supporté (webm sur desktop, mp4/m4a sur Safari/iOS)
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "audio/mpeg";
      
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const extension = mimeType.split("/")[1] || "webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const formData = new FormData();
        formData.append("audio", audioBlob, `recording.${extension}`);

        try {
          const response = await fetch("/api/transcribe", {
            method: "POST",
            body: formData,
          });
          const data = await response.json();
          if (response.ok && data.text) {
            setInput((prev) => prev + (prev ? " " : "") + data.text);
          } else {
            setFeedback("Impossible de transcrire l'audio.");
          }
        } catch (error) {
          console.error(error);
          setFeedback("Erreur lors de la transcription.");
        }

        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error(error);
      setFeedback("Impossible d'accéder au micro.");
    }
  };

  const triggerNormalization = async () => {
    if (messages.length < 4) {
      setFeedback("⚠️ Conversez davantage avant de normaliser (au moins 2 échanges).");
      return;
    }

    setIsNormalizing(true);
    setFeedback("🔄 Envoi vers n8n pour normalisation...");

    const canvasId = `canvas-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      const response = await fetch("/api/canvas-normalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          structuredNeed,
          transcript: transcriptPayload,
          canvasId,
        }),
      });

      const data = await response.json();
      if (response.ok && data.normalizedCanvas) {
        console.log("Normalized canvas received:", data.normalizedCanvas);
        
        // Assurer que tous les champs requis existent
        const nc = {
          problemToSolve: data.normalizedCanvas.problemToSolve || "À définir",
          useCaseDescription: data.normalizedCanvas.useCaseDescription || "À définir",
          dataAndProductUsed: Array.isArray(data.normalizedCanvas.dataAndProductUsed) ? data.normalizedCanvas.dataAndProductUsed : [],
          businessObjective: data.normalizedCanvas.businessObjective || "À définir",
          keyResults: Array.isArray(data.normalizedCanvas.keyResults) ? data.normalizedCanvas.keyResults : [],
          stakeholders: Array.isArray(data.normalizedCanvas.stakeholders) ? data.normalizedCanvas.stakeholders : [],
          strategicFit: data.normalizedCanvas.strategicFit || { importance: "medium", frequency: "medium", rationale: "" },
        };
        
        // Stocker le canevas normalisé pour affichage direct
        setNormalizedCanvas(nc);
        
        // Mettre à jour aussi structuredNeed pour la cohérence
        setStructuredNeed((prev) => ({
          ...prev,
          strategicFit: nc.strategicFit,
          expectedOutcomes: {
            ...prev.expectedOutcomes,
            successKPIs: nc.keyResults,
          },
          summaryNote: nc.useCaseDescription,
        }));
        setFeedback("✅ Canevas normalisé par n8n ! Consultez le canevas ci-dessous.");
      } else {
        setFeedback("⚠️ Normalisation partielle (n8n).");
      }
    } catch (error) {
      console.error("manual normalization error", error);
      setFeedback("Erreur lors de la normalisation n8n.");
    } finally {
      setIsNormalizing(false);
    }
  };

  const addToGallery = async () => {
    const canvas = convertToCanvas(structuredNeed, recipientEmail || "anonymous");

    try {
      setFeedback("📤 Ajout à la galerie...");
      const response = await fetch("/api/add-to-gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canvas }),
      });

      const data = await response.json();
      if (response.ok) {
        setFeedback(data.message || "✅ Canevas ajouté à la galerie !");
      } else {
        setFeedback("Impossible d'ajouter à la galerie.");
      }
    } catch (error) {
      console.error("add-to-gallery error", error);
      setFeedback("Erreur lors de l'ajout à la galerie.");
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

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Échec de l'envoi");
      }
      setFeedback(
        data.message || "Synthèse envoyée au webhook (n8n). Vous serez invité à voter pour les meilleurs use cases prochainement.",
      );
    } catch (error) {
      console.error(error);
      setFeedback("Impossible d'envoyer la synthèse. Vérifiez le webhook n8n.");
    } finally {
      setFinalizing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Bloc 1 : Chat (2/3) + Synthèse & Transcription (1/3) sur desktop */}
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[2fr_1fr]">
        <section className="order-1 flex flex-col rounded-3xl border border-zinc-200 bg-white/90 p-6 shadow-lg" style={{ maxHeight: "calc(100vh - 200px)" }}>
        <header className="mb-5 flex flex-wrap items-center gap-3">
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
          ref={messagesContainerRef}
          className="flex-1 min-h-0 space-y-4 overflow-y-auto [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none" }}
        >
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "max-w-3xl rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
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
              className="min-h-[70px] flex-1 resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500"
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
              type="button"
              className={cn(
                "mb-1 rounded-2xl p-3 text-white transition disabled:opacity-50",
                isRecording ? "bg-red-600 hover:bg-red-700 animate-pulse" : "bg-zinc-600 hover:bg-zinc-700",
              )}
              onClick={toggleRecording}
              disabled={loading}
              title={isRecording ? "Arrêter l'enregistrement" : "Dicter (Whisper)"}
            >
              <Mic className="h-5 w-5" />
            </button>
            <button
              className="mb-1 rounded-2xl bg-emerald-600 p-3 text-white transition hover:bg-emerald-700 disabled:opacity-50"
              disabled={!input.trim() || loading}
              onClick={sendMessage}
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <span>Statut : {status === "ready" ? "Prêt pour synthèse" : "Collecte en cours"}</span>
            {feedback && <span className="text-amber-600">{feedback}</span>}
            {messages.length >= 4 && (
              <button
                type="button"
                onClick={triggerNormalization}
                disabled={isNormalizing}
                className="ml-auto rounded-full bg-purple-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
              >
                {isNormalizing ? "🔄 Analyse..." : "🤖 Compléter le canevas"}
              </button>
            )}
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
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              className="flex items-center justify-center gap-2 rounded-2xl border-2 border-purple-600 bg-white px-4 py-3 text-sm font-semibold text-purple-600 transition hover:bg-purple-50 disabled:border-zinc-200 disabled:text-zinc-400"
              disabled={structuredNeed.copilotOpportunities.length === 0}
              onClick={addToGallery}
            >
              <Sparkles className="h-4 w-4" />
              Ajouter à la galerie
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:bg-zinc-200 disabled:text-zinc-400"
              disabled={!canSendSummary || finalizing}
              onClick={finalize}
            >
              {finalizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Envoyer le compte-rendu
            </button>
          </div>
        </div>
      </section>

      {/* Colonne droite : Synthèse + Transcription */}
      <div className="order-2 space-y-6 lg:order-2" style={{ maxHeight: "calc(100vh - 200px)", overflowY: "auto" }}>
        <SummaryPanel
          key={`summary-${messages.length}`}
          data={structuredNeed}
          phase={phaseLabels[phase]}
        />

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

      {/* Bloc 2 : Canevas Use Case (pleine largeur) - order-3 pour mobile */}
      <div className="order-3 rounded-3xl border border-zinc-200 bg-white/90 p-6 shadow-lg">
        {normalizedCanvas ? (
          <EditableCanvasCard
            canvas={{
              ...normalizedCanvas,
              id: `canvas-${Date.now()}`,
              createdAt: new Date().toISOString(),
              submittedBy: recipientEmail || "preview",
              votes: 0,
              voters: [],
            }}
            onUpdate={(updatedCanvas: UseCaseCanvas) => {
              setNormalizedCanvas(updatedCanvas);
              // Sync avec structuredNeed
              setStructuredNeed((prev) => ({
                ...prev,
                strategicFit: updatedCanvas.strategicFit,
              }));
            }}
          />
        ) : (
          <CanvasCard
            canvas={useMemo(() => convertToCanvas(structuredNeed, recipientEmail || "preview"), [structuredNeed, recipientEmail])}
            isPreview
            onUpdateFit={(importance: FitLevel, frequency: FitLevel) => {
              setStructuredNeed((prev) => ({
                ...prev,
                strategicFit: {
                  ...prev.strategicFit,
                  importance,
                  frequency,
                },
              }));
            }}
          />
        )}
      </div>
    </div>
  );
};

