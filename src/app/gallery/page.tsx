"use client";

import { useEffect, useState } from "react";
import { UseCaseCanvas } from "@/lib/useCaseCanvas";
import { CanvasCard } from "@/components/CanvasCard";
import { Loader2, ThumbsUp, ChevronDown, ChevronUp, FileText, Copy, X, Check } from "lucide-react";
import Link from "next/link";
import { NotificationContainer, Notification } from "@/components/Notification";

export default function GalleryPage() {
  const [canvases, setCanvases] = useState<UseCaseCanvas[]>([]);
  const [loading, setLoading] = useState(true);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [userEmail, setUserEmail] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [templateData, setTemplateData] = useState<string>("");
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    try {
      const response = await fetch("/api/gallery");
      const data = await response.json();
      console.log("Gallery data received:", data);
      
      // S'assurer que canvases est bien un array
      const canvasesArray = Array.isArray(data.canvases) ? data.canvases : [];
      console.log("Canvases array:", canvasesArray.length, "items");
      
      setCanvases(canvasesArray);
    } catch (error) {
      console.error("fetch gallery error", error);
      setCanvases([]);
    } finally {
      setLoading(false);
    }
  };

  const addNotification = (type: "success" | "error" | "info" | "warning", message: string, duration?: number) => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setNotifications((prev) => [...prev, { id, type, message, duration }]);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const toggleExpanded = (canvasId: string) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(canvasId)) {
        newSet.delete(canvasId);
      } else {
        newSet.add(canvasId);
      }
      return newSet;
    });
  };

  const handleVote = async (canvasId: string) => {
    if (!userEmail || !userEmail.includes("@")) {
      addNotification("warning", "Saisissez votre email avant de voter.");
      return;
    }

    try {
      const response = await fetch("/api/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canvasId, voterEmail: userEmail }),
      });

      if (response.ok) {
        setVotedIds((prev) => new Set(prev).add(canvasId));
        await fetchGallery(); // Rafraîchir pour voir le nouveau compte
        addNotification("success", "🗳️ Votre vote a été enregistré avec succès !");
      } else {
        addNotification("error", "Erreur lors du vote. Veuillez réessayer.");
      }
    } catch (error) {
      console.error("vote error", error);
      addNotification("error", "Erreur lors du vote. Veuillez réessayer.");
    }
  };

  const handleTemplateAgent = async (canvasId: string) => {
    try {
      addNotification("info", "Récupération du template agent...");
      const response = await fetch(`/api/template-agent?id=${encodeURIComponent(canvasId)}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Template agent data:", data);
        
        // Formatter les données pour affichage
        const formattedData = typeof data === 'string' 
          ? data 
          : JSON.stringify(data, null, 2);
        
        setTemplateData(formattedData);
        setShowTemplateModal(true);
        setCopied(false);
        addNotification("success", "Template agent récupéré avec succès !");
      } else {
        addNotification("error", "Erreur lors de la récupération du template agent.");
      }
    } catch (error) {
      console.error("template agent error", error);
      addNotification("error", "Erreur lors de la récupération du template agent.");
    }
  };

  const handleCopyTemplate = async () => {
    try {
      await navigator.clipboard.writeText(templateData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      addNotification("success", "📋 Template copié dans le presse-papier !");
    } catch (error) {
      console.error("Erreur lors de la copie", error);
      addNotification("error", "Erreur lors de la copie dans le presse-papier");
    }
  };

  const closeTemplateModal = () => {
    setShowTemplateModal(false);
    setTemplateData("");
    setCopied(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#04030a] via-[#0d0a16] to-[#05030a] py-12 text-white">
      <div className="pointer-events-none absolute inset-x-[10%] top-10 h-64 rounded-full bg-gradient-to-r from-[#eb54c7]/40 via-[#7c3aed]/30 to-[#2dd4bf]/30 blur-[140px]" />
      <main className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <header className="space-y-5 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-pink-300/90">
            Galerie · Use Cases Copilot BMS
          </p>
          <h1 className="text-4xl font-semibold text-white">
            Votez pour les meilleurs use cases
          </h1>
          <p className="mx-auto max-w-3xl text-lg text-slate-200">
            Découvrez les canevas use case proposés par vos collègues. Votez pour ceux qui vous semblent les plus pertinents
            pour prioriser les déploiements Copilot M365 et agents déclaratifs.
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/" className="text-pink-300/70 underline underline-offset-4 transition hover:text-pink-300">
              ← Retour à l'accueil
            </Link>
          </div>
        </header>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">
          <label className="block text-sm text-slate-200">
            Votre email (pour enregistrer vos votes)
            <input
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="prenom.nom@bms.com"
              className="mt-2 w-full max-w-md rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-white placeholder:text-white/40 focus:border-pink-400 focus:outline-none"
            />
          </label>
        </div>

        {loading ? (
          <div className="mt-12 flex items-center justify-center gap-3 text-slate-300">
            <Loader2 className="h-5 w-5 animate-spin" />
            Chargement de la galerie...
          </div>
        ) : canvases.length === 0 ? (
          <section className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-[0_35px_120px_rgba(5,5,18,0.8)]">
            <p className="text-lg text-slate-300">
              Aucun canevas dans la galerie pour le moment.
            </p>
            <p className="mt-4 text-sm text-slate-400">
              Les premiers use cases apparaîtront ici dès qu'ils seront soumis via le bouton "Ajouter à la galerie".
            </p>
          </section>
        ) : (
          <div className="mt-12 space-y-6">
            {canvases
              .sort((a, b) => b.votes - a.votes)
              .map((canvas) => {
                const isExpanded = expandedIds.has(canvas.id);
                return (
                  <div key={canvas.id} className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_35px_120px_rgba(5,5,18,0.8)]">
                    {/* En-tête de l'accordéon */}
                    <button
                      type="button"
                      onClick={() => toggleExpanded(canvas.id)}
                      className="w-full px-6 py-5 text-left transition hover:bg-white/10"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <h2 className="text-2xl font-bold text-white">
                            {canvas.agentName || "Agent sans nom"}
                          </h2>
                          <p className="text-base text-slate-300">
                            {canvas.agentDescription || "Description à définir"}
                          </p>
                          <p className="text-xs font-mono text-slate-500">
                            ID: {canvas.id}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-lg font-semibold text-pink-300">{canvas.votes} vote{canvas.votes > 1 ? "s" : ""}</p>
                            <p className="text-xs text-slate-400">
                              {new Date(canvas.createdAt).toLocaleDateString("fr-FR")}
                            </p>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="h-6 w-6 text-pink-300" />
                          ) : (
                            <ChevronDown className="h-6 w-6 text-pink-300" />
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Contenu de l'accordéon */}
                    {isExpanded && (
                      <div className="border-t border-white/10 p-6 space-y-6">
                        <CanvasCard canvas={canvas} />
                        
                        <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
                          <div className="text-sm text-slate-200">
                            <p className="font-semibold">{canvas.votes} vote{canvas.votes > 1 ? "s" : ""}</p>
                            <p className="text-xs text-slate-400">
                              Soumis par {canvas.submittedBy}
                            </p>
                          </div>
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => handleVote(canvas.id)}
                              disabled={votedIds.has(canvas.id) || canvas.voters.includes(userEmail)}
                              className="flex items-center gap-2 rounded-full bg-pink-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-pink-700 disabled:bg-zinc-600 disabled:opacity-50"
                            >
                              <ThumbsUp className="h-4 w-4" />
                              {votedIds.has(canvas.id) || canvas.voters.includes(userEmail) ? "Voté" : "Voter"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleTemplateAgent(canvas.id)}
                              className="flex items-center gap-2 rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700"
                            >
                              <FileText className="h-4 w-4" />
                              Template Agent
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </main>

      {/* Modal Template Agent */}
      {showTemplateModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={closeTemplateModal}
        >
          <div 
            className="relative w-full max-w-4xl max-h-[80vh] overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-b from-[#0d0a16] to-[#05030a] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* En-tête de la modal */}
            <div className="flex items-center justify-between border-b border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-purple-400" />
                <h3 className="text-2xl font-bold text-white">Template Agent</h3>
              </div>
              <button
                onClick={closeTemplateModal}
                className="rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Contenu du template */}
            <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(80vh - 180px)' }}>
              <pre className="rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-slate-200 overflow-x-auto">
                {templateData}
              </pre>
            </div>

            {/* Pied de page avec bouton copier */}
            <div className="border-t border-white/10 bg-white/5 p-6">
              <button
                onClick={handleCopyTemplate}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-purple-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-purple-700"
              >
                {copied ? (
                  <>
                    <Check className="h-5 w-5" />
                    Copié !
                  </>
                ) : (
                  <>
                    <Copy className="h-5 w-5" />
                    Copier le template
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications en bas à gauche */}
      <NotificationContainer notifications={notifications} onClose={removeNotification} />
    </div>
  );
}

