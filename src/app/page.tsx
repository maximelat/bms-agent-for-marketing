import { AgentPlayground } from "@/components/AgentPlayground";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#04030a] via-[#0d0a16] to-[#05030a] text-white">
      <div className="pointer-events-none absolute inset-x-[10%] top-10 h-64 rounded-full bg-gradient-to-r from-[#eb54c7]/40 via-[#7c3aed]/30 to-[#2dd4bf]/30 blur-[140px]" />
      <main className="relative mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6">
        <section className="space-y-5 text-center sm:text-left">
          <p className="text-xs uppercase tracking-[0.4em] text-pink-300/90">Bienvenue · Entretien Copilot BMS</p>
          <h1 className="text-4xl font-semibold text-white">Votre échange guidé pour cartographier les besoins agents</h1>
          <p className="max-w-3xl text-lg text-slate-200">
            Helios vous accompagne pour identifier les irritants de votre quotidien, cartographier vos données M365 et faire émerger
            les opportunités d'agents Copilot. La transcription ainsi que le rapport normalisé sont générés automatiquement.
          </p>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href="/questionnaire" className="text-pink-300/70 underline underline-offset-4 transition hover:text-pink-300">
              Formulaire guidé
            </Link>
            <span className="text-slate-500">·</span>
            <Link href="/realtime" className="text-pink-300/70 underline underline-offset-4 transition hover:text-pink-300">
              Mode audio (Realtime)
            </Link>
            <span className="text-slate-500">·</span>
            <Link href="/gallery" className="inline-flex items-center gap-1 text-pink-300 underline underline-offset-4 transition hover:text-pink-400">
              🗳️ Voter pour un use case
            </Link>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-gradient-to-br from-[#281036] via-[#2f0f4a] to-[#0f1c3d] p-6 shadow-[0_35px_120px_rgba(5,5,18,0.8)]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-100">
            <p className="text-xs uppercase tracking-wide text-pink-200/80">Ce que va vous demander Helios</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Déroulé de l’entretien</h2>
            <ol className="mt-6 space-y-4">
              <li className="rounded-2xl border border-white/10 bg-white/10 p-4 transition hover:bg-white/15">
                <p className="text-sm font-semibold text-pink-200">1 · Contexte & irritants</p>
                <p className="text-sm text-slate-100/80">
                  Rôle exact, périmètre, jalons hebdo, objectifs chiffrés et irritants majeurs. Donnez des volumes (emails/semaine,
                  livrables/mois, temps passé...).
                </p>
              </li>
              <li className="rounded-2xl border border-white/10 bg-white/10 p-4 transition hover:bg-white/15">
                <p className="text-sm font-semibold text-pink-200">2 · Cartographie des données</p>
                <p className="text-sm text-slate-100/80">
                  Pour chaque source, précisez localisation (SharePoint, Teams, outil métier...), fréquence de mise à jour,
                  propriétaire, sensibilité et besoins (lecture/écriture).
                </p>
              </li>
              <li className="rounded-2xl border border-white/10 bg-white/10 p-4 transition hover:bg-white/15">
                <p className="text-sm font-semibold text-pink-200">3 · Agents Copilot M365 Lite & Mon idéal</p>
                <p className="text-sm text-slate-100/80">
                  Helios présente les agents Copilot M365 Lite (recherche intelligente, résumés auto, suggestions contextuelles), puis vous invite à imaginer des automatisations dans un monde sans contraintes techniques.
                </p>
              </li>
              <li className="rounded-2xl border border-white/10 bg-white/10 p-4 transition hover:bg-white/15">
                <p className="text-sm font-semibold text-pink-200">4 · Strategic fit & next steps</p>
                <p className="text-sm text-slate-100/80">
                  Validez importance, fréquence, rationale, ainsi que les prochaines étapes ou acteurs impliqués.
                </p>
              </li>
            </ol>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-slate-950/40 p-1 shadow-[0_35px_120px_rgba(1,0,8,0.9)]">
          <div className="rounded-[30px] border border-white/10 bg-white/95 text-zinc-900">
            <AgentPlayground />
          </div>
        </section>
      </main>
    </div>
  );
}
