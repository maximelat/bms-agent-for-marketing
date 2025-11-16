"use client";

import { useEffect, useState } from "react";
import { UseCaseCanvas } from "@/lib/useCaseCanvas";
import { CanvasCard } from "@/components/CanvasCard";
import { Loader2, ThumbsUp, ChevronDown, ChevronUp, FileText, Copy, X, Check } from "lucide-react";
import Link from "next/link";
import { NotificationContainer, Notification } from "@/components/Notification";

export default function GalleryPage() {
  const [canvases, setCanvases] = useState<UseCaseCanvas[]>([]);
  const [filteredCanvases, setFilteredCanvases] = useState<UseCaseCanvas[]>([]);
  const [loading, setLoading] = useState(true);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [userEmail, setUserEmail] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [templateData, setTemplateData] = useState<any>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [teamFilter, setTeamFilter] = useState("");
  const [isTeamFilterActive, setIsTeamFilterActive] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortBy, setSortBy] = useState<"votes" | "category" | "strategic">("votes");

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
      applyTeamFilter(canvasesArray, teamFilter, isTeamFilterActive);
    } catch (error) {
      console.error("fetch gallery error", error);
      setCanvases([]);
      setFilteredCanvases([]);
    } finally {
      setLoading(false);
    }
  };

  const applyTeamFilter = (canvasArray: UseCaseCanvas[], filter: string, active: boolean) => {
    let filtered: UseCaseCanvas[];
    
    if (!active || !filter.trim()) {
      // Montrer seulement les publics si pas de filtre
      filtered = canvasArray.filter(c => c.team === "public" || !c.team);
    } else {
      // Filtrer par team spécifique
      filtered = canvasArray.filter(c => c.team === filter.trim());
    }

    // Appliquer le filtre catégorie si actif
    if (categoryFilter) {
      filtered = filtered.filter(c => c.category === categoryFilter);
    }

    setFilteredCanvases(filtered);
  };

  const handleCategoryFilter = (category: string) => {
    setCategoryFilter(category);
    applyTeamFilter(canvases, teamFilter, isTeamFilterActive);
    if (category) {
      addNotification("info", `Filtre catégorie "${category}" appliqué`);
    }
  };

  const getUniqueCategories = () => {
    // Récupérer les catégories de tous les canvas (avant filtre catégorie)
    let baseCanvases = canvases;
    if (isTeamFilterActive && teamFilter.trim()) {
      baseCanvases = canvases.filter(c => c.team === teamFilter.trim());
    } else {
      baseCanvases = canvases.filter(c => c.team === "public" || !c.team);
    }
    
    const categories = new Set(baseCanvases.map(c => c.category).filter(Boolean));
    return Array.from(categories).sort();
  };

  const getSortedCanvases = () => {
    let sorted = [...filteredCanvases];
    
    switch (sortBy) {
      case "votes":
        return sorted.sort((a, b) => b.votes - a.votes);
      case "category":
        return sorted.sort((a, b) => (a.category || "").localeCompare(b.category || ""));
      case "strategic":
        return sorted.sort((a, b) => {
          const scoreA = (a.strategicFit.importance === "high" ? 3 : a.strategicFit.importance === "medium" ? 2 : 1) *
                         (a.strategicFit.frequency === "high" ? 3 : a.strategicFit.frequency === "medium" ? 2 : 1);
          const scoreB = (b.strategicFit.importance === "high" ? 3 : b.strategicFit.importance === "medium" ? 2 : 1) *
                         (b.strategicFit.frequency === "high" ? 3 : b.strategicFit.frequency === "medium" ? 2 : 1);
          return scoreB - scoreA;
        });
      default:
        return sorted;
    }
  };

  const handleTeamFilterChange = (team: string) => {
    setTeamFilter(team);
    setIsTeamFilterActive(true);
    applyTeamFilter(canvases, team, true);
    addNotification("info", `Filtre équipe "${team}" appliqué`);
  };

  const handlePublicMode = () => {
    setTeamFilter("");
    setIsTeamFilterActive(false);
    applyTeamFilter(canvases, "", false);
    addNotification("info", "Mode public activé");
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
        const result = await response.json();
        console.log("Vote result:", result);
        
        setVotedIds((prev) => new Set(prev).add(canvasId));
        await fetchGallery(); // Rafraîchir pour voir le nouveau compte
        addNotification("success", "🗳️ Votre vote a été enregistré avec succès !");
      } else {
        const errorData = await response.json();
        console.error("Vote error:", errorData);
        addNotification("error", errorData.error || "Erreur lors du vote. Veuillez réessayer.");
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
        
        // Extraire le premier élément si c'est un tableau
        const templateInfo = Array.isArray(data) ? data[0] : data;
        
        setTemplateData(templateInfo);
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
      const textToCopy = JSON.stringify(templateData, null, 2);
      await navigator.clipboard.writeText(textToCopy);
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
    setTemplateData(null);
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

        {/* Filtre par équipe */}
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="mb-3 text-sm font-semibold text-slate-200">Accès à la galerie</p>
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              placeholder="Code équipe (ou laissez vide pour public)"
              className="flex-1 min-w-[200px] rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-white placeholder:text-white/40 focus:border-purple-400 focus:outline-none"
            />
            <button
              onClick={() => handleTeamFilterChange(teamFilter)}
              disabled={!teamFilter.trim()}
              className="rounded-xl bg-purple-600 px-6 py-2 font-semibold text-white transition hover:bg-purple-700 disabled:bg-zinc-600 disabled:opacity-50"
            >
              Accéder à l'équipe
            </button>
            <button
              onClick={handlePublicMode}
              className="rounded-xl border-2 border-purple-600 bg-transparent px-6 py-2 font-semibold text-purple-300 transition hover:bg-purple-600/20"
            >
              Mode Public
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {isTeamFilterActive ? `📁 Équipe: ${teamFilter}` : "🌍 Mode public"}
          </p>
        </div>

        {/* Filtres et tri */}
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm text-slate-200">
                Filtrer par catégorie
                <select
                  value={categoryFilter}
                  onChange={(e) => handleCategoryFilter(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-white focus:border-purple-400 focus:outline-none"
                >
                  <option value="" className="bg-zinc-900">Toutes les catégories</option>
                  {getUniqueCategories().map((cat) => (
                    <option key={cat} value={cat} className="bg-zinc-900">
                      {cat}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            
            <div>
              <label className="block text-sm text-slate-200">
                Trier par
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="mt-2 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-white focus:border-pink-400 focus:outline-none"
                >
                  <option value="votes" className="bg-zinc-900">🗳️ Nombre de votes</option>
                  <option value="category" className="bg-zinc-900">📂 Catégorie métier</option>
                  <option value="strategic" className="bg-zinc-900">⭐ Score strategic fit</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
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
        ) : filteredCanvases.length === 0 ? (
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
            {getSortedCanvases().map((canvas) => {
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
                          <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold text-white">
                              {canvas.agentName || "Agent sans nom"}
                            </h2>
                            {canvas.category && (
                              <span className="rounded-full bg-purple-600/30 px-3 py-1 text-xs font-semibold text-purple-300 border border-purple-500/50">
                                {canvas.category}
                              </span>
                            )}
                          </div>
                          <p className="text-base text-slate-300">
                            {canvas.agentDescription || "Description à définir"}
                          </p>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="font-mono text-slate-500">ID: {canvas.id}</span>
                            {canvas.team && canvas.team !== "public" && (
                              <span className="rounded-full bg-blue-600/30 px-2 py-1 text-blue-300 border border-blue-500/50">
                                📁 {canvas.team}
                              </span>
                            )}
                          </div>
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
            <div className="overflow-y-auto p-6 space-y-4" style={{ maxHeight: 'calc(80vh - 180px)' }}>
              {templateData && (
                <>
                  {/* Informations Agent */}
                  {(templateData["Agent-Name"] || templateData["Agent-Description"]) && (
                    <div className="rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-900/30 to-purple-800/20 p-5">
                      <h4 className="text-sm font-semibold uppercase tracking-wide text-purple-300 mb-3">🤖 Informations Agent</h4>
                      <div className="space-y-2">
                        {templateData["Agent-Name"] && (
                          <div>
                            <p className="text-xs text-slate-400">Nom de l'agent</p>
                            <p className="text-base font-semibold text-white">{templateData["Agent-Name"]}</p>
                          </div>
                        )}
                        {templateData["Agent-Description"] && (
                          <div>
                            <p className="text-xs text-slate-400 mb-2">Description</p>
                            <div className="rounded-lg bg-black/30 p-3">
                              <pre className="text-sm text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                                {templateData["Agent-Description"]}
                              </pre>
                            </div>
                          </div>
                        )}
                        {templateData["Agent-Instruction"] && (
                          <div>
                            <p className="text-xs text-slate-400 mb-2">Instructions</p>
                            <div className="rounded-lg bg-black/30 p-4 max-h-96 overflow-y-auto">
                              <pre className="text-sm text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                                {templateData["Agent-Instruction"]}
                              </pre>
                            </div>
                          </div>
                        )}
                        {templateData["Agent-Knowledge"] && (
                          <div>
                            <p className="text-xs text-slate-400 mb-2">Connaissances</p>
                            <div className="rounded-lg bg-black/30 p-4">
                              <ul className="space-y-2">
                                {(typeof templateData["Agent-Knowledge"] === 'string' 
                                  ? JSON.parse(templateData["Agent-Knowledge"]) 
                                  : templateData["Agent-Knowledge"]
                                ).map((item: string, idx: number) => (
                                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-200">
                                    <span className="text-purple-400 mt-1">•</span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                        {templateData["Agent-capabilities"] && (
                          <div>
                            <p className="text-xs text-slate-400 mb-2">Capacités</p>
                            <div className="rounded-lg bg-black/30 p-4">
                              <ul className="space-y-2">
                                {(typeof templateData["Agent-capabilities"] === 'string' 
                                  ? JSON.parse(templateData["Agent-capabilities"]) 
                                  : templateData["Agent-capabilities"]
                                ).map((item: string, idx: number) => (
                                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-200">
                                    <span className="text-purple-400 mt-1">•</span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Contexte rapide */}
                  <div className="grid gap-4 md:grid-cols-3">
                    {templateData.persona && (
                      <div className="rounded-xl border border-pink-500/30 bg-gradient-to-br from-pink-900/30 to-pink-800/20 p-4">
                        <p className="text-xs font-semibold uppercase text-pink-300">Persona</p>
                        <p className="mt-2 text-sm text-slate-200">{templateData.persona}</p>
                      </div>
                    )}
                    {templateData.painpoint && (
                      <div className="rounded-xl border border-orange-500/30 bg-gradient-to-br from-orange-900/30 to-orange-800/20 p-4">
                        <p className="text-xs font-semibold uppercase text-orange-300">Pain point</p>
                        <p className="mt-2 text-sm text-slate-200">{templateData.painpoint}</p>
                      </div>
                    )}
                    {templateData.opportunitécopilot && (
                      <div className="rounded-xl border border-teal-500/30 bg-gradient-to-br from-teal-900/30 to-teal-800/20 p-4">
                        <p className="text-xs font-semibold uppercase text-teal-300">Opportunité Copilot</p>
                        <p className="mt-2 text-sm text-slate-200">{templateData.opportunitécopilot}</p>
                      </div>
                    )}
                  </div>

                  {/* General */}
                  <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-900/30 to-emerald-800/20 p-5">
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-emerald-300 mb-3">📋 General</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      {templateData.problemToSolve && (
                        <div>
                          <p className="text-xs text-slate-400">Problem to solve</p>
                          <p className="mt-1 text-sm text-slate-200">{templateData.problemToSolve}</p>
                        </div>
                      )}
                      {templateData.useCaseDescription && (
                        <div>
                          <p className="text-xs text-slate-400">Use case description</p>
                          <p className="mt-1 text-sm text-slate-200">{templateData.useCaseDescription}</p>
                        </div>
                      )}
                    </div>
                    {templateData.dataAndProductUsed && (
                      <div className="mt-4">
                        <p className="text-xs text-slate-400">Data & product used</p>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-200">
                          {(typeof templateData.dataAndProductUsed === 'string' 
                            ? JSON.parse(templateData.dataAndProductUsed) 
                            : templateData.dataAndProductUsed
                          ).map((item: string, idx: number) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Objectives & Key Results */}
                  <div className="rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-900/30 to-blue-800/20 p-5">
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-blue-300 mb-3">🎯 Objectives & Key Results</h4>
                    <div className="space-y-4">
                      {templateData.businessObjective && (
                        <div>
                          <p className="text-xs text-slate-400">Business objective</p>
                          <p className="mt-1 text-sm text-slate-200">{templateData.businessObjective}</p>
                        </div>
                      )}
                      {templateData.keyResults && (
                        <div>
                          <p className="text-xs text-slate-400">Key results</p>
                          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-200">
                            {(typeof templateData.keyResults === 'string' 
                              ? JSON.parse(templateData.keyResults) 
                              : templateData.keyResults
                            ).map((kr: string, idx: number) => (
                              <li key={idx}>{kr}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {templateData.stakeholders && (
                        <div>
                          <p className="text-xs text-slate-400">Stakeholders</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {(typeof templateData.stakeholders === 'string' 
                              ? JSON.parse(templateData.stakeholders) 
                              : templateData.stakeholders
                            ).map((sh: string, idx: number) => (
                              <span key={idx} className="rounded-full bg-blue-600/30 px-3 py-1 text-xs text-blue-200">
                                {sh}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Strategic Fit */}
                  {(templateData["strategicFit.importance"] || templateData["strategicFit.frequency"]) && (
                    <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-900/30 to-amber-800/20 p-5">
                      <h4 className="text-sm font-semibold uppercase tracking-wide text-amber-300 mb-3">⭐ Strategic Fit</h4>
                      <div className="grid gap-3 md:grid-cols-3">
                        {templateData["strategicFit.importance"] && (
                          <div>
                            <p className="text-xs text-slate-400">Importance</p>
                            <p className="mt-1 text-sm font-semibold text-white capitalize">{templateData["strategicFit.importance"]}</p>
                          </div>
                        )}
                        {templateData["strategicFit.frequency"] && (
                          <div>
                            <p className="text-xs text-slate-400">Frequency</p>
                            <p className="mt-1 text-sm font-semibold text-white capitalize">{templateData["strategicFit.frequency"]}</p>
                          </div>
                        )}
                        {templateData["strategicFit.rationale"] && (
                          <div className="md:col-span-3">
                            <p className="text-xs text-slate-400">Rationale</p>
                            <p className="mt-1 text-sm text-slate-200">{templateData["strategicFit.rationale"]}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
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

