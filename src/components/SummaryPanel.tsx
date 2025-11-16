"use client";

import { StructuredNeed, FitLevel } from "@/lib/structuredNeed";
import { cn } from "@/lib/utils";

interface Props {
  data: StructuredNeed;
  phase: string;
}

const levelLabel: Record<FitLevel, string> = {
  low: "Faible",
  medium: "Moyenne",
  high: "Élevée",
};

const gridLevels: FitLevel[] = ["low", "medium", "high"];

export const SummaryPanel = ({ data, phase }: Props) => {
  return (
    <div className="space-y-6 rounded-2xl border border-zinc-200 bg-white/70 p-6 shadow-sm backdrop-blur">
      <header>
        <p className="text-xs uppercase tracking-wide text-emerald-600">Session en cours</p>
        <h2 className="text-2xl font-semibold text-zinc-900">Synthèse structurée</h2>
        <p className="text-sm text-zinc-500">Phase active : {phase}</p>
      </header>

      <section className="space-y-2">
        <h3 className="font-semibold text-zinc-800">Persona</h3>
        <p className="text-sm text-zinc-600">
          {data.persona.role ?? "Rôle à préciser"}
        </p>
        {data.workflow.keyActivities?.length ? (
          <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-600">
            {data.workflow.keyActivities.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold text-zinc-800">Friction & données</h3>
        {data.painPoints.length ? (
          <div className="space-y-3">
            {data.painPoints.slice(0, 3).map((pain, idx) => (
              <div key={idx} className="rounded-lg border border-amber-100 bg-amber-50/70 p-3 text-sm">
                <p className="font-medium text-amber-900">{pain.theme}</p>
                <p className="text-amber-800">{pain.impact}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">Points de douleur à documenter.</p>
        )}

        {data.dataFootprint.sources.length ? (
          <div className="rounded-lg border border-sky-100 bg-sky-50/80 p-3 text-sm text-sky-900">
            <p className="font-semibold">Sources critiques ({data.dataFootprint.sources.length})</p>
            <ul className="mt-2 space-y-1">
              {data.dataFootprint.sources.slice(0, 3).map((source) => (
                <li key={source.label}>
                  {source.label} · {source.location} · {source.approximateVolume}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold text-zinc-800">Opportunités Copilot</h3>
        {data.copilotOpportunities.length ? (
          <div className="space-y-3">
            {data.copilotOpportunities.map((opportunity) => (
              <div key={opportunity.name} className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-3 text-sm">
                <p className="font-semibold text-emerald-900">{opportunity.name}</p>
                <p className="text-emerald-800">{opportunity.trigger}</p>
                <p className="text-emerald-700">
                  Sortie attendue : {opportunity.expectedOutput} · Priorité {opportunity.priority}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">Décrire les scénarios cibles.</p>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold text-zinc-800">Strategic fit</h3>
        <p className="text-sm text-zinc-500">{data.strategicFit.rationale || "En attente d'évaluation."}</p>
        <div className="text-xs text-zinc-600">
          Importance : {levelLabel[data.strategicFit.importance]} · 
          Fréquence : {levelLabel[data.strategicFit.frequency]}
        </div>
      </section>
    </div>
  );
};

