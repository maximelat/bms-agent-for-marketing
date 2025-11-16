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
import { NotificationContainer, Notification } from "./Notification";

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
  const [teamCode, setTeamCode] = useState<string | null>(null);
  const [teamInput, setTeamInput] = useState("");
  const [showTeamSelector, setShowTeamSelector] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: initialAssistantMessage },
  ]);
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<AgentPhase>("contexte");
  const [status, setStatus] = useState<"collect" | "ready">("collect");
  const [structuredNeed, setStructuredNeed] = useState<StructuredNeed>(defaultStructuredNeed);
  const [loading, setLoading] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [agentVersion] = useState<"v1" | "v2">("v2");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [previousResponseId, setPreviousResponseId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isNormalizing, setIsNormalizing] = useState(false);
  const [normalizedCanvas, setNormalizedCanvas] = useState<any>(null);
  const [isEditingCanvas, setIsEditingCanvas] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [addedToGallery, setAddedToGallery] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const sessionIdRef = useRef(`session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const handleTeamSelection = (team: string) => {
    setTeamCode(team);
    setShowTeamSelector(false);
    addNotification("success", `Équipe "${team}" sélectionnée pour cette session`);
  };

  const canFinalize = status === "ready" && structuredNeed.copilotOpportunities.length > 0;
  const emailIsValid = /\S+@\S+\.\S+/.test(recipientEmail.trim());
  const canSendSummary = canFinalize && emailIsValid;
  
  // Vérifier si le canevas est complet pour ajout à la galerie
  const isCanvasComplete = normalizedCanvas && 
    normalizedCanvas.Persona && normalizedCanvas.Persona !== "À définir" &&
    normalizedCanvas.painpoint && normalizedCanvas.painpoint !== "À définir" &&
    normalizedCanvas.opportunitécopilot && normalizedCanvas.opportunitécopilot !== "À définir" &&
    normalizedCanvas.problemToSolve && normalizedCanvas.problemToSolve !== "À définir" &&
    normalizedCanvas.useCaseDescription && normalizedCanvas.useCaseDescription !== "À définir" &&
    normalizedCanvas.businessObjective && normalizedCanvas.businessObjective !== "À définir" &&
    normalizedCanvas.keyResults && normalizedCanvas.keyResults.length > 0 &&
    normalizedCanvas.stakeholders && normalizedCanvas.stakeholders.length > 0;

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
  const addNotification = (type: "success" | "error" | "info" | "warning", message: string, duration?: number) => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setNotifications((prev) => [...prev, { id, type, message, duration }]);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const copyTranscript = async () => {
    if (!transcriptText) return;
    try {
      await navigator.clipboard.writeText(transcriptText);
      addNotification("success", "📋 Transcription copiée dans le presse-papier !");
    } catch (error) {
      console.error(error);
      addNotification("error", "Impossible de copier la transcription.");
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
          team: teamCode || "public",
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
        addNotification("success", "✅ Analyse terminée ! Le rapport est prêt.");
      }
    } catch (error) {
      console.error(error);
      
      // Vérifier si c'est une erreur HTML (504, 500...)
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("<!DOCTYPE") || errorMessage.includes("Unexpected token '<'")) {
        addNotification("warning", "⚠️ Le serveur a mis trop de temps à répondre. Réessayez.");
      } else {
        addNotification("error", "Erreur de dialogue, tentative suivante recommandée.");
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
            addNotification("error", "Impossible de transcrire l'audio.");
          }
        } catch (error) {
          console.error(error);
          addNotification("error", "Erreur lors de la transcription.");
        }

        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error(error);
      addNotification("error", "Impossible d'accéder au microphone.");
    }
  };

  const triggerNormalization = async () => {
    if (messages.length < 4) {
      addNotification("warning", "⚠️ Conversez davantage avant de normaliser (au moins 2 échanges).");
      return;
    }

    setIsNormalizing(true);
    addNotification("info", "🔄 Envoi vers n8n pour normalisation...");

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
        console.log("StructuredNeed update received:", data.structuredNeedUpdate);
        
        // Assurer que tous les champs requis existent
        const nc = {
          Persona: data.normalizedCanvas.Persona || "À définir",
          painpoint: data.normalizedCanvas.painpoint || "À définir",
          opportunitécopilot: data.normalizedCanvas.opportunitécopilot || "À définir",
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
        
        // Mapper normalizedCanvas vers structuredNeed pour remplir la Synthèse structurée
        setStructuredNeed((prev) => ({
          ...prev,
          persona: {
            ...prev.persona,
            role: nc.Persona || prev.persona.role,
          },
          painPoints: nc.painpoint && nc.painpoint !== "À définir"
            ? [{ theme: nc.painpoint, rootCause: nc.problemToSolve, impact: "", frequency: nc.strategicFit.frequency, kpiAffected: "" }]
            : prev.painPoints,
          copilotOpportunities: nc.opportunitécopilot && nc.opportunitécopilot !== "À définir"
            ? [{
                name: nc.useCaseDescription.substring(0, 50),
                phase: "discover" as const,
                trigger: nc.opportunitécopilot,
                inputSignals: nc.dataAndProductUsed.slice(0, 3),
                expectedOutput: nc.useCaseDescription,
                successMetric: nc.keyResults[0] || "",
                priority: "must-have" as const,
              }]
            : prev.copilotOpportunities,
          dataFootprint: {
            ...prev.dataFootprint,
            sources: nc.dataAndProductUsed.map((item: string) => ({
              label: item.split("(")[0]?.trim() || item,
              location: (item.includes("SharePoint") ? "SharePoint" : item.includes("Teams") ? "Teams" : "Other") as any,
              dataType: "",
              sensitivity: "internal" as const,
              approximateVolume: "",
              refreshRate: "",
              ingestionNeed: "read" as const,
              owner: "",
            })),
          },
          strategicFit: nc.strategicFit,
          expectedOutcomes: {
            ...prev.expectedOutcomes,
            successKPIs: nc.keyResults,
          },
        }));
        
        addNotification("success", "✅ Canevas normalisé ! Consultez le canevas et la synthèse structurée.");
      } else {
        addNotification("warning", "⚠️ Normalisation partielle (n8n).");
      }
    } catch (error) {
      console.error("manual normalization error", error);
      addNotification("error", "Erreur lors de la normalisation n8n.");
    } finally {
      setIsNormalizing(false);
    }
  };

  const addToGallery = async (targetTeam: string) => {
    // Utiliser le canevas normalisé s'il existe, sinon convertir depuis structuredNeed
    const canvas = normalizedCanvas
      ? {
          ...normalizedCanvas,
          id: `canvas-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          submittedBy: recipientEmail || "anonymous",
          team: targetTeam,
          votes: 0,
          voters: [],
        }
      : {
          ...convertToCanvas(structuredNeed, recipientEmail || "anonymous"),
          team: targetTeam,
        };

    try {
      addNotification("info", `📤 Ajout du canevas à la galerie (${targetTeam})...`);
      setShowGalleryModal(false);
      
      const response = await fetch("/api/add-to-gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          canvas,
          sessionId: sessionIdRef.current,
          transcript: transcriptPayload,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        addNotification("success", "🎉 Canevas ajouté à la galerie avec succès !");
        setAddedToGallery(true);
        
        // Animation du bouton - reset après 3 secondes
        setTimeout(() => setAddedToGallery(false), 3000);
      } else {
        addNotification("error", "Impossible d'ajouter le canevas à la galerie.");
      }
    } catch (error) {
      console.error("add-to-gallery error", error);
      addNotification("error", "Erreur lors de l'ajout à la galerie.");
    }
  };

  const finalize = async () => {
    setFinalizing(true);
    
    // Utiliser le canevas normalisé si disponible
    const finalCanvas = normalizedCanvas
      ? {
          ...normalizedCanvas,
          id: `canvas-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          submittedBy: recipientEmail || "anonymous",
          votes: 0,
          voters: [],
        }
      : convertToCanvas(structuredNeed, recipientEmail || "anonymous");
    
    try {
      const response = await fetch("/api/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          structuredNeed,
          useCaseCanvas: finalCanvas,
          transcript: transcriptPayload,
          recipientEmail: recipientEmail.trim(),
          sessionId: sessionIdRef.current,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Échec de l'envoi");
      }
      addNotification("success", "📧 Synthèse envoyée avec succès ! Vous serez invité à voter prochainement.");
    } catch (error) {
      console.error(error);
      addNotification("error", "Impossible d'envoyer la synthèse. Vérifiez le webhook n8n.");
    } finally {
      setFinalizing(false);
    }
  };

  // Team selector avant le chat
  if (showTeamSelector) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-full max-w-2xl rounded-3xl border border-zinc-200 bg-white/90 p-8 shadow-lg">
          <h2 className="mb-4 text-2xl font-semibold text-zinc-900">Sélectionnez votre équipe</h2>
          <p className="mb-6 text-sm text-zinc-600">
            Cette information sera associée à toute la session et aux canvas créés.
          </p>

          <div className="space-y-4">
            <div>
              <input
                type="text"
                value={teamInput}
                onChange={(e) => setTeamInput(e.target.value)}
                placeholder="Code équipe"
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleTeamSelection(teamInput)}
                disabled={!teamInput.trim()}
                className="flex-1 rounded-full bg-purple-600 px-6 py-3 font-semibold text-white transition hover:bg-purple-700 disabled:bg-zinc-300 disabled:text-zinc-500"
              >
                Commencer avec l'équipe {teamInput.trim() && `"${teamInput}"`}
              </button>
              <button
                onClick={() => handleTeamSelection("public")}
                className="flex-1 rounded-full border-2 border-purple-600 bg-white px-6 py-3 font-semibold text-purple-600 transition hover:bg-purple-50"
              >
                Mode Public
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:bg-zinc-200 disabled:text-zinc-400"
            disabled={!emailIsValid || finalizing || !isCanvasComplete}
            onClick={finalize}
            title={!isCanvasComplete ? "Complétez d'abord tous les champs du canevas" : !emailIsValid ? "Saisissez un email valide" : "Envoyer le compte-rendu"}
          >
            {finalizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Envoyer le compte-rendu
          </button>
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
      <div className="order-3 space-y-4 rounded-3xl border border-zinc-200 bg-white/90 p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-zinc-900">Canevas Use Case</h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={triggerNormalization}
              disabled={isNormalizing || messages.length < 6}
              className="rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:bg-zinc-300 disabled:text-zinc-500"
              title={messages.length < 6 ? "Conversez davantage (au moins 3 échanges) avant de normaliser" : "Compléter automatiquement le canevas via n8n"}
            >
              {isNormalizing ? "🔄 Analyse..." : "🤖 Compléter le canevas"}
            </button>
            <button
              type="button"
              onClick={() => setIsEditingCanvas(!isEditingCanvas)}
              disabled={!normalizedCanvas}
              className="rounded-full border border-purple-600 bg-white px-4 py-2 text-sm font-semibold text-purple-600 transition hover:bg-purple-50 disabled:border-zinc-300 disabled:text-zinc-400"
              title={!normalizedCanvas ? "Complétez d'abord le canevas automatiquement avant d'éditer" : "Éditer manuellement les champs"}
            >
              {isEditingCanvas ? "✓ Terminer l'édition" : "✏️ Éditer"}
            </button>
            {isCanvasComplete && (
              <button
                type="button"
                onClick={() => setShowGalleryModal(true)}
                disabled={addedToGallery}
                className={cn(
                  "rounded-full border-2 px-4 py-2 text-sm font-semibold transition-all duration-300",
                  addedToGallery
                    ? "border-emerald-600 bg-emerald-600 text-white scale-110 shadow-lg shadow-emerald-500/50"
                    : "border-emerald-600 bg-white text-emerald-600 hover:bg-emerald-50"
                )}
              >
                {addedToGallery ? "✅ Ajouté !" : "➕ Ajouter à la galerie"}
              </button>
            )}
          </div>
        </div>
        
        {isEditingCanvas && normalizedCanvas ? (
          <EditableCanvasCard
            canvas={{
              ...normalizedCanvas,
              id: `canvas-preview`,
              createdAt: new Date().toISOString(),
              submittedBy: recipientEmail || "preview",
              votes: 0,
              voters: [],
            }}
            onUpdate={(updatedCanvas: UseCaseCanvas) => {
              setNormalizedCanvas(updatedCanvas);
              setIsEditingCanvas(false);
              addNotification("success", "✅ Canevas mis à jour !");
            }}
          />
        ) : (
          <CanvasCard
            canvas={
              normalizedCanvas
                ? {
                    ...normalizedCanvas,
                    id: `canvas-preview`,
                    createdAt: new Date().toISOString(),
                    submittedBy: recipientEmail || "preview",
                    votes: 0,
                    voters: [],
                  }
                : convertToCanvas(structuredNeed, recipientEmail || "preview")
            }
            isPreview
            onUpdateFit={(importance: FitLevel, frequency: FitLevel) => {
              if (normalizedCanvas) {
                setNormalizedCanvas((prev: any) => ({
                  ...prev,
                  strategicFit: {
                    ...prev.strategicFit,
                    importance,
                    frequency,
                  },
                }));
              }
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

      {/* Notifications en bas à gauche */}
      <NotificationContainer notifications={notifications} onClose={removeNotification} />

      {/* Modal choix Public/Équipe */}
      {showGalleryModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowGalleryModal(false)}
        >
          <div 
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-zinc-300 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* En-tête */}
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4">
              <h3 className="text-xl font-bold text-white">Ajouter à la galerie</h3>
              <p className="mt-1 text-sm text-emerald-50">Choisissez la visibilité de votre canevas</p>
            </div>

            {/* Contenu */}
            <div className="p-6 space-y-4">
              {/* Option Équipe actuelle */}
              <button
                onClick={() => addToGallery(teamCode || "public")}
                className="w-full rounded-xl border-2 border-purple-500 bg-purple-50 p-4 text-left transition hover:bg-purple-100 hover:border-purple-600"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-purple-500 p-2 text-white">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-zinc-900">Équipe : {teamCode || "public"}</p>
                    <p className="mt-1 text-sm text-zinc-600">
                      Visible uniquement pour les membres de votre équipe
                    </p>
                  </div>
                </div>
              </button>

              {/* Option Public */}
              <button
                onClick={() => addToGallery("public")}
                className="w-full rounded-xl border-2 border-emerald-500 bg-emerald-50 p-4 text-left transition hover:bg-emerald-100 hover:border-emerald-600"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-emerald-500 p-2 text-white">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-zinc-900">Public</p>
                    <p className="mt-1 text-sm text-zinc-600">
                      Visible par tous les utilisateurs de la galerie
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {/* Pied de page */}
            <div className="border-t border-zinc-200 bg-zinc-50 px-6 py-4">
              <button
                onClick={() => setShowGalleryModal(false)}
                className="w-full rounded-xl bg-zinc-200 px-4 py-2 font-semibold text-zinc-700 transition hover:bg-zinc-300"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

