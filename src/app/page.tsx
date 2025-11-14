import { AgentPlayground } from "@/components/AgentPlayground";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#04030a] via-[#0d0a16] to-[#05030a] py-12 text-white">
      <div className="pointer-events-none absolute inset-x-[10%] top-10 h-64 rounded-full bg-gradient-to-r from-[#eb54c7]/40 via-[#7c3aed]/30 to-[#2dd4bf]/30 blur-[140px]" />
      <main className="relative mx-auto flex max-w-6xl flex-col gap-10 px-4 sm:px-6">
        <header className="space-y-5 text-center sm:text-left">
          <p className="text-xs uppercase tracking-[0.4em] text-pink-300/90">Bienvenue · Entretien Copilot BMS</p>
          <h1 className="text-4xl font-semibold text-white">Votre échange guidé pour cartographier les besoins agents</h1>
          <p className="max-w-3xl text-lg text-slate-200">
            Helios vous accompagne pendant 20 minutes pour identifier les irritants de votre quotidien, les données manipulées
            et les opportunités d’agents Copilot M365. Suivez la conversation, relisez la transcription si besoin et validez le
            rapport à la fin : tout est formaté automatiquement pour les équipes produit.
          </p>
        </header>

        
       

        <section className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition hover:border-pink-400/30 hover:bg-white/10"
        >
          <div className="rounded-2xl border border-white/10 bg-white/90 p-6 text-zinc-900">
            <p className="text-xs uppercase tracking-wide text-emerald-600">Déroulé standard</p>
            <h3 className="mt-2 text-2xl font-semibold">Ce que va vous demander Helios</h3>
            <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-zinc-700">
              <li>
                <span className="font-semibold text-emerald-700">Contexte & irritants :</span> rôle exact, périmètre, jalons
                hebdo, objectifs chiffrés, irritants majeurs (temps, qualité, dépendances). Donnez des volumes (emails/semaine,
                livrables/mois…).
              </li>
              <li>
                <span className="font-semibold text-emerald-700">Cartographie des données :</span> pour chaque source importante,
                précisez l’emplacement (SharePoint, Teams, outil métier…), la fréquence de mise à jour, le propriétaire et la
                sensibilité.
              </li>
              <li>
                <span className="font-semibold text-emerald-700">Idées Copilot & automatisations :</span> décrire le déclencheur,
                l’entrée attendue, le résultat escompté, les KPI de succès et les dépendances techniques.
              </li>
              <li>
                <span className="font-semibold text-emerald-700">Validation Strategic Fit :</span> importance, fréquence, rationale,
                prochaines étapes souhaitées.
              </li>
            </ol>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/90 p-6 text-zinc-900">
            <p className="text-xs uppercase tracking-wide text-emerald-600">Spécifique au mode Realtime</p>
            <h3 className="mt-2 text-2xl font-semibold">Checklist audio</h3>
            <ul className="mt-4 space-y-3 text-sm text-zinc-700">
              <li>
                <span className="font-semibold text-emerald-700">1. Navigateur & micro :</span> ouvrez{" "}
                <Link href="/realtime" className="text-emerald-600 underline underline-offset-4">
                  la console audio
                </Link>{" "}
                dans Chrome/Edge, branchez votre casque, autorisez le micro.
              </li>
              <li>
                <span className="font-semibold text-emerald-700">2. Logs visibles :</span> la transcription apparaît en direct,
                vous pouvez la copier pour vérifier une information ou briefer un collègue.
              </li>
              <li>
                <span className="font-semibold text-emerald-700">3. À la coupure :</span> cliquez sur “Couper & générer le
                rapport”. Helios assemble automatiquement la fiche StructuredNeed + strategic fit, à retrouver dans le panneau
                “Rapport structuré”.
              </li>
              <li>
                <span className="font-semibold text-emerald-700">4. Partage :</span> exportez le JSON ou la transcription pour vos
                toolkits Copilot / n8n. Aucun paramétrage technique n’est nécessaire côté participant.
              </li>
            </ul>
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
