import { AgentPlayground } from "@/components/AgentPlayground";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[rgba(190,43,187,0.08)] via-white to-white py-10">
      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 sm:px-6">
        <header className="space-y-4 text-center sm:text-left">
          <p className="text-xs uppercase tracking-[0.4em] text-[#BE2BBB]">BMS · Copilot Discovery</p>
          <h1 className="text-4xl font-semibold text-[#1F1F2B]">
            Recueil digitalisé des besoins agents M365 Copilot
          </h1>
          <p className="max-w-3xl text-lg text-[#4B4B5F]">
            Ce compagnon assiste les équipes marketing produits BMS pour capturer des cas d’usage, cartographier les
            données SharePoint/Teams et préparer la matrice de strategic fit. Chaque entretien est guidé, structuré et
            exporté automatiquement.
          </p>
        </header>

        <section className="grid gap-6 rounded-3xl border border-[rgba(190,43,187,0.2)] bg-white/90 p-6 shadow-sm lg:grid-cols-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#9A2299]">3 temps forts</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[#4B4B5F]">
              <li>Exploration métier et irritants quantifiés.</li>
              <li>Cartographie des données (origine, volume, fréquence, confidentialité).</li>
              <li>Projection dans Agent Copilot  + scénarios d’automatisations avancées.</li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#9A2299]">Livrables normés</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[#4B4B5F]">
              <li>Objet StructuredNeed (JSON) prêt pour MDM / sheet.</li>
              <li>Matrice Strategic Fit (Importance x Fréquence).</li>
              <li>Résumé envoyé vers n8n + email (si SMTP configuré).</li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#9A2299]">Modes complémentaires</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[#4B4B5F]">
              <li>
                Formulaire guidé (questionnaire Google Forms) :{" "}
                <Link href="/questionnaire" className="text-[#BE2BBB] underline underline-offset-4">
                  Agent Questionnaire
                </Link>
                .
              </li>
              <li>
                Sessions audio/WebRTC (gpt-realtime & gpt-audio) :{" "}
                <Link href="/realtime" className="text-[#BE2BBB] underline underline-offset-4">
                  Mode Realtime
                </Link>
                .
              </li>
            </ul>
          </div>
        </section>

        <AgentPlayground />
      </main>
    </div>
  );
}
