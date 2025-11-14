import { QuestionnaireAgent } from "@/components/QuestionnaireAgent";
import Link from "next/link";

export default function QuestionnairePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#03030b] via-[#0c0919] to-[#03030b] py-12 text-white">
      <div className="pointer-events-none absolute inset-x-[5%] top-0 h-72 rounded-full bg-gradient-to-r from-[#f973c8]/30 via-[#7c3aed]/25 to-transparent blur-[160px]" />
      <main className="relative mx-auto flex max-w-5xl flex-col gap-10 px-4 sm:px-6">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.45em] text-pink-300/90">Helios · Agent formulaire</p>
          <h1 className="text-4xl font-semibold text-white">Questionnaire normé (mode formulaire)</h1>
          <p className="max-w-3xl text-lg text-slate-300">
            Pour les entretiens asynchrones ou lorsque l’utilisateur préfère un formulaire guidé, cette page reprend la
            trame Google Forms proposée. Chaque section alimente directement l’objet StructuredNeed, sans dépendre du chat
            ou du mode Realtime.
          </p>
          <div className="flex flex-wrap gap-4 text-sm text-pink-200">
            <Link href="/" className="text-pink-300 underline underline-offset-4">
              ← Agent classique
            </Link>
            <Link href="/realtime" className="text-pink-300 underline underline-offset-4">
              Mode Realtime & audio →
            </Link>
          </div>
        </header>

        <section className="rounded-[32px] border border-white/10 bg-slate-950/50 p-1 shadow-[0_35px_120px_rgba(1,0,8,0.9)]">
          <div className="rounded-[28px] border border-white/10 bg-white text-zinc-900">
            <QuestionnaireAgent />
          </div>
        </section>
      </main>
    </div>
  );
}

