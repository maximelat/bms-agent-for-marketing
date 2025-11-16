"use client";

import { useEffect, useState } from "react";
import { UseCaseCanvas } from "@/lib/useCaseCanvas";
import { CanvasCard } from "@/components/CanvasCard";
import { Loader2, ThumbsUp } from "lucide-react";
import Link from "next/link";

export default function GalleryPage() {
  const [canvases, setCanvases] = useState<UseCaseCanvas[]>([]);
  const [loading, setLoading] = useState(true);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [userEmail, setUserEmail] = useState("");

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

  const handleVote = async (canvasId: string) => {
    if (!userEmail || !userEmail.includes("@")) {
      alert("Saisissez votre email avant de voter.");
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
      }
    } catch (error) {
      console.error("vote error", error);
    }
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
          <div className="mt-12 space-y-8">
            {canvases
              .sort((a, b) => b.votes - a.votes)
              .map((canvas) => (
                <div key={canvas.id} className="relative">
                  <CanvasCard canvas={canvas} />
                  
                  <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="text-sm text-slate-200">
                      <p className="font-semibold">{canvas.votes} vote{canvas.votes > 1 ? "s" : ""}</p>
                      <p className="text-xs text-slate-400">
                        Soumis par {canvas.submittedBy} le {new Date(canvas.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleVote(canvas.id)}
                      disabled={votedIds.has(canvas.id) || canvas.voters.includes(userEmail)}
                      className="flex items-center gap-2 rounded-full bg-pink-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-pink-700 disabled:bg-zinc-600 disabled:opacity-50"
                    >
                      <ThumbsUp className="h-4 w-4" />
                      {votedIds.has(canvas.id) || canvas.voters.includes(userEmail) ? "Voté" : "Voter"}
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </main>
    </div>
  );
}

