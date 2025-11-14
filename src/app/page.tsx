import { AgentPlayground } from "@/components/AgentPlayground";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#04030a] via-[#0d0a16] to-[#05030a] py-12 text-white">
      <div className="pointer-events-none absolute inset-x-[10%] top-10 h-64 rounded-full bg-gradient-to-r from-[#eb54c7]/40 via-[#7c3aed]/30 to-[#2dd4bf]/30 blur-[140px]" />
      <main className="relative mx-auto flex max-w-6xl flex-col gap-10 px-4 sm:px-6">
        <header className="space-y-4 text-center sm:text-left">
          <p className="text-xs uppercase tracking-[0.45em] text-pink-300/90">BMS · Copilot Discovery</p>
          <h1 className="text-4xl font-semibold text-white">
            Recueil digitalisé des besoins agents M365 Copilot
          </h1>
          <p className="max-w-3xl text-lg text-slate-300">
            Ce compagnon assiste les équipes marketing produits BMS pour capturer des cas d’usage, cartographier les
            données SharePoint/Teams et préparer la matrice de strategic fit. Chaque entretien est guidé, structuré et
            exporté automatiquement vers le webhook n8n (email géré ensuite par vos automatisations).
          </p>
        </header>

        <section className="grid gap-4 rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_25px_80px_rgba(2,2,10,0.65)] lg:grid-cols-4">
          {[
            {
              title: "3 temps forts",
              items: [
                "Exploration métier et irritants quantifiés.",
                "Cartographie fine des données (origine, volume, fréquence, confidentialité).",
                "Projection Copilot + scénarios d’automatisations avancées.",
              ],
            },
            {
              title: "Livrables normés",
              items: [
                "Objet StructuredNeed (JSON) prêt pour MDM / sheet.",
                "Matrice Strategic Fit (Importance x Fréquence).",
                "Résumé envoyé vers n8n + email (si SMTP configuré).",
              ],
            },
            {
              title: "Modes complémentaires",
              items: [
                <>
                  Formulaire guidé (questionnaire Google Forms) :{" "}
                  <Link href="/questionnaire" className="text-pink-300 underline underline-offset-4">
                    Agent Questionnaire
                  </Link>
                  .
                </>,
                <>
                  Sessions audio/WebRTC (gpt-realtime & gpt-audio) :{" "}
                  <Link href="/realtime" className="text-pink-300 underline underline-offset-4">
                    Mode Realtime
                  </Link>
                  .
                </>,
              ],
            },
            {
              title: "Prérequis",
              items: [
                "OPENAI_API_KEY valide (profil GPT-5 par défaut).",
                "N8N_WEBHOOK_URL optionnel, sinon valeur fournie.",
                "FTP_* + OVH_ADRESSE pour la CI/CD.",
              ],
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition hover:border-pink-400/40 hover:bg-white/10"
            >
              <p className="text-sm font-semibold uppercase tracking-wide text-pink-200">{card.title}</p>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-200 marker:text-pink-400">
                {card.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
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
