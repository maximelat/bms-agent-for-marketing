import { AgentPlayground } from "@/components/AgentPlayground";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-100 via-white to-zinc-50 py-10">
      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 sm:px-6">
        <header className="space-y-4 text-center sm:text-left">
          <p className="text-xs uppercase tracking-[0.4em] text-emerald-600">BMS · Copilot Discovery</p>
          <h1 className="text-4xl font-semibold text-zinc-900">
            Recueil digitalisé des besoins agents M365 Copilot
          </h1>
          <p className="max-w-3xl text-lg text-zinc-600">
            Ce compagnon assiste les équipes marketing produits BMS pour capturer des cas d’usage, cartographier les
            données SharePoint/Teams et préparer la matrice de strategic fit. Chaque entretien est guidé, structuré et
            exporté automatiquement vers le webhook n8n (email géré ensuite par vos automatisations).
          </p>
        </header>

        <section className="grid gap-6 rounded-3xl border border-emerald-100 bg-white/80 p-6 shadow-sm lg:grid-cols-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">3 temps forts</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-600">
              <li>Exploration métier et irritants quantifiés.</li>
              <li>Cartographie fine des données (origine, volume, fréquence, confidentialité).</li>
              <li>Projection Copilot + scénarios d’automatisations avancées.</li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Livrables normés</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-600">
              <li>Objet StructuredNeed (JSON) prêt pour MDM / sheet.</li>
              <li>Matrice Strategic Fit (Importance x Fréquence).</li>
              <li>Résumé envoyé vers n8n + email (si SMTP configuré).</li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Modes complémentaires</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-600">
              <li>
                Formulaire guidé (questionnaire Google Forms) :{" "}
                <Link href="/questionnaire" className="text-emerald-600 underline underline-offset-4">
                  Agent Questionnaire
                </Link>
                .
              </li>
              <li>
                Sessions audio/WebRTC (gpt-realtime & gpt-audio) :{" "}
                <Link href="/realtime" className="text-emerald-600 underline underline-offset-4">
                  Mode Realtime
                </Link>
                .
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Prérequis</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-600">
              <li>OPENAI_API_KEY valide (profil GPT-5 par défaut).</li>
              <li>N8N_WEBHOOK_URL optionnel, sinon valeur fournie.</li>
              <li>FTP_* + OVH_ADRESSE pour la CI/CD.</li>
            </ul>
          </div>
        </section>

        <AgentPlayground />
      </main>
    </div>
  );
}
