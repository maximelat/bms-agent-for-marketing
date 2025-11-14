import { QuestionnaireAgent } from "@/components/QuestionnaireAgent";
import Link from "next/link";

export default function QuestionnairePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-emerald-50 to-white py-10">
      <main className="mx-auto flex max-w-5xl flex-col gap-10 px-4 sm:px-6">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.4em] text-emerald-600">Helios · Agent formulaire</p>
          <h1 className="text-4xl font-semibold text-zinc-900">Questionnaire normé (mode formulaire)</h1>
          <p className="max-w-3xl text-lg text-zinc-600">
            Pour les entretiens asynchrones ou lorsque l’utilisateur préfère un formulaire guidé, cette page reprend la
            trame Google Forms proposée. Chaque section alimente directement l’objet StructuredNeed, sans dépendre du chat
            ou du mode Realtime.
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link href="/" className="text-emerald-600 underline underline-offset-4">
              ← Agent classique
            </Link>
            <Link href="/realtime" className="text-emerald-600 underline underline-offset-4">
              Mode Realtime & audio →
            </Link>
          </div>
        </header>

        <QuestionnaireAgent />
      </main>
    </div>
  );
}

