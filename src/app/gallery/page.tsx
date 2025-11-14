export default function GalleryPage() {
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
        </header>

        <section className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-[0_35px_120px_rgba(5,5,18,0.8)]">
          <p className="text-lg text-slate-300">
            La galerie de vote sera bientôt disponible.
          </p>
          <p className="mt-4 text-sm text-slate-400">
            Les canevas use case sont actuellement envoyés vers n8n. Une interface de vote collaborative sera déployée
            prochainement pour permettre à toute l'équipe de prioriser les initiatives Copilot.
          </p>
        </section>
      </main>
    </div>
  );
}

