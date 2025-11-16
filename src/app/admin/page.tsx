"use client";

import { useState } from "react";
import { Loader2, Lock, RefreshCw, Users, TrendingUp } from "lucide-react";
import Link from "next/link";

const ADMIN_PASSWORD = "Travail2025!";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [classificationResult, setClassificationResult] = useState<any>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
    } else {
      alert("Mot de passe incorrect !");
    }
  };

  const handleReclassification = async () => {
    if (!confirm("Lancer la reclassification de tous les agents ?")) return;

    setIsClassifying(true);
    setClassificationResult(null);

    try {
      const response = await fetch("/api/admin/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      setClassificationResult(data);
    } catch (error) {
      console.error("Classification error:", error);
      alert("Erreur lors de la classification");
    } finally {
      setIsClassifying(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#04030a] via-[#0d0a16] to-[#05030a] flex items-center justify-center p-4">
        <div className="pointer-events-none absolute inset-x-[10%] top-10 h-64 rounded-full bg-gradient-to-r from-[#eb54c7]/40 via-[#7c3aed]/30 to-[#2dd4bf]/30 blur-[140px]" />
        
        <div className="relative w-full max-w-md">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl">
            <div className="mb-6 flex items-center justify-center">
              <Lock className="h-12 w-12 text-pink-400" />
            </div>
            
            <h1 className="mb-2 text-center text-2xl font-bold text-white">
              Administration
            </h1>
            <p className="mb-6 text-center text-sm text-slate-400">
              Entrez le mot de passe pour accéder au panneau d'administration
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mot de passe"
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/40 focus:border-pink-400 focus:outline-none"
                  autoFocus
                />
              </div>
              
              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 px-4 py-3 font-semibold text-white transition hover:from-pink-700 hover:to-purple-700"
              >
                Se connecter
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/" className="text-sm text-slate-400 underline underline-offset-4 hover:text-slate-300">
                ← Retour à l'accueil
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#04030a] via-[#0d0a16] to-[#05030a] py-12 text-white">
      <div className="pointer-events-none absolute inset-x-[10%] top-10 h-64 rounded-full bg-gradient-to-r from-[#eb54c7]/40 via-[#7c3aed]/30 to-[#2dd4bf]/30 blur-[140px]" />
      
      <main className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <header className="mb-8 space-y-5">
          <p className="text-xs uppercase tracking-[0.4em] text-pink-300/90">
            Administration
          </p>
          <h1 className="text-4xl font-semibold text-white">
            Panneau d'administration
          </h1>
          <div className="flex gap-3">
            <Link href="/" className="text-pink-300/70 underline underline-offset-4 transition hover:text-pink-300">
              ← Retour à l'accueil
            </Link>
            <span className="text-slate-500">·</span>
            <Link href="/gallery" className="text-pink-300/70 underline underline-offset-4 transition hover:text-pink-300">
              Galerie
            </Link>
          </div>
        </header>

        <div className="space-y-6">
          {/* Classification des agents */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-purple-400" />
              <h2 className="text-xl font-semibold text-white">
                Classification des agents
              </h2>
            </div>
            
            <p className="mb-4 text-sm text-slate-300">
              Lancer la reclassification automatique de tous les agents par métier (via OpenAI) et scoring de strategic fit.
            </p>

            <button
              onClick={handleReclassification}
              disabled={isClassifying}
              className="flex items-center gap-2 rounded-full bg-purple-600 px-6 py-3 font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
            >
              {isClassifying ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Classification en cours...
                </>
              ) : (
                <>
                  <RefreshCw className="h-5 w-5" />
                  Lancer la reclassification
                </>
              )}
            </button>

            {classificationResult && (
              <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-900/20 p-4">
                <p className="text-sm font-semibold text-emerald-300">
                  ✅ Classification terminée
                </p>
                <p className="mt-2 text-xs text-slate-300">
                  {classificationResult.classified} agents classifiés
                </p>
              </div>
            )}
          </div>

          {/* Gestion des équipes */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <Users className="h-6 w-6 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">
                Gestion des équipes
              </h2>
            </div>
            
            <p className="text-sm text-slate-300">
              Fonctionnalité à venir : Vue par équipe, statistiques, historique...
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

