"use client";

import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import {
  StructuredNeed,
  PriorityLevel,
  FitLevel,
  defaultStructuredNeed,
} from "@/lib/structuredNeed";
import { cn } from "@/lib/utils";
import { Loader2, PlusCircle, Trash2, CheckCircle2, AlertCircle } from "lucide-react";

type PainPointForm = {
  theme: string;
  rootCause: string;
  impact: string;
  frequency: FitLevel;
  kpiAffected: string;
};

type DataSourceForm = {
  label: string;
  location: "SharePoint" | "OneDrive" | "Teams" | "Local" | "BusinessApp" | "Email" | "Other";
  dataType: string;
  sensitivity: "public" | "internal" | "confidential";
  approximateVolume: string;
  refreshRate: string;
  ingestionNeed: "read" | "write" | "bi-directional";
  owner: string;
};

type OpportunityForm = {
  name: string;
  trigger: string;
  inputSignals: string;
  expectedOutput: string;
  successMetric: string;
  priority: PriorityLevel;
  phase: "discover" | "design" | "execute" | "report";
};

type AutomationForm = {
  system: string;
  action: string;
  dependency: string;
  owner: string;
};

const newPainPoint = (): PainPointForm => ({
  theme: "",
  rootCause: "",
  impact: "",
  frequency: "medium",
  kpiAffected: "",
});

const newSource = (): DataSourceForm => ({
  label: "",
  location: "SharePoint",
  dataType: "",
  sensitivity: "internal",
  approximateVolume: "",
  refreshRate: "",
  ingestionNeed: "read",
  owner: "",
});

const newOpportunity = (): OpportunityForm => ({
  name: "",
  trigger: "",
  inputSignals: "",
  expectedOutput: "",
  successMetric: "",
  priority: "should-have",
  phase: "discover",
});

const newAutomation = (): AutomationForm => ({
  system: "",
  action: "",
  dependency: "",
  owner: "",
});

const splitList = (value: string) =>
  value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);

export const QuestionnaireAgent = () => {
  const [persona, setPersona] = useState({
    name: "",
    role: "",
    businessUnit: "",
    geography: "",
    seniority: "",
    languages: "",
  });

  const [weeklyCanvas, setWeeklyCanvas] = useState({
    rituals: "",
    energyDrains: "",
    alertSignals: "",
  });

  const [tooling, setTooling] = useState("");
  const [painPoints, setPainPoints] = useState<PainPointForm[]>([newPainPoint()]);
  const [dataSources, setDataSources] = useState<DataSourceForm[]>([newSource()]);
  const [opportunities, setOpportunities] = useState<OpportunityForm[]>([newOpportunity()]);
  const [automations, setAutomations] = useState<AutomationForm[]>([newAutomation()]);

  const [kpis, setKpis] = useState("");
  const [horizon, setHorizon] = useState("");
  const [adoptionPlan, setAdoptionPlan] = useState("");
  const [nextSteps, setNextSteps] = useState("");
  const [pilotAnchor, setPilotAnchor] = useState("");
  const [importance, setImportance] = useState<FitLevel>("medium");
  const [frequency, setFrequency] = useState<FitLevel>("medium");
  const [rationale, setRationale] = useState("");
  const [security, setSecurity] = useState("");
  const [compliance, setCompliance] = useState("");
  const [approvals, setApprovals] = useState("");
  const [changePlan, setChangePlan] = useState("");
  const [summaryNote, setSummaryNote] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [feedback, setFeedback] = useState("");

  const structuredNeed = useMemo<StructuredNeed>(() => {
    return {
      ...defaultStructuredNeed,
      persona: {
        name: persona.name || undefined,
        role: persona.role || undefined,
        businessUnit: persona.businessUnit || undefined,
        geography: persona.geography || undefined,
        seniority: persona.seniority || undefined,
        languages: splitList(persona.languages),
      },
      workflow: {
        keyActivities: splitList(weeklyCanvas.rituals),
        currentTools: splitList(tooling),
        cycleTimePain: weeklyCanvas.energyDrains || undefined,
      },
      painPoints: painPoints
        .filter((point) => point.theme && point.impact)
        .map((point) => ({
          theme: point.theme,
          rootCause: point.rootCause,
          impact: point.impact,
          frequency: point.frequency,
          kpiAffected: point.kpiAffected || undefined,
        })),
      dataFootprint: {
        sources: dataSources
          .filter((source) => source.label)
          .map((source) => ({
            label: source.label,
            location: source.location,
            dataType: source.dataType,
            sensitivity: source.sensitivity,
            approximateVolume: source.approximateVolume,
            refreshRate: source.refreshRate,
            ingestionNeed: source.ingestionNeed,
            owner: source.owner || undefined,
          })),
        manualFilesVolume: weeklyCanvas.alertSignals || undefined,
      },
      copilotOpportunities: opportunities
        .filter((opportunity) => opportunity.name)
        .map((opportunity) => ({
          name: opportunity.name,
          phase: opportunity.phase,
          trigger: opportunity.trigger,
          inputSignals: splitList(opportunity.inputSignals),
          expectedOutput: opportunity.expectedOutput,
          successMetric: opportunity.successMetric,
          priority: opportunity.priority,
        })),
      automationWishlist: automations
        .filter((automation) => automation.system && automation.action)
        .map((automation) => ({
          system: automation.system,
          action: automation.action,
          dependency: automation.dependency,
          owner: automation.owner || undefined,
        })),
      governance: {
        securityConsiderations: security || undefined,
        complianceConstraints: compliance || undefined,
        approvals: approvals || undefined,
        changeManagement: changePlan || undefined,
      },
      expectedOutcomes: {
        successKPIs: splitList(kpis),
        timeline: horizon || undefined,
        adoptionPlan: adoptionPlan || undefined,
      },
      strategicFit: {
        importance,
        frequency,
        rationale,
      },
      summaryNote: summaryNote || undefined,
      nextSteps: splitList(nextSteps),
    };
  }, [
    persona,
    weeklyCanvas,
    tooling,
    painPoints,
    dataSources,
    opportunities,
    automations,
    security,
    compliance,
    approvals,
    changePlan,
    kpis,
    horizon,
    adoptionPlan,
    importance,
    frequency,
    rationale,
    summaryNote,
    nextSteps,
  ]);

  const addItem = <T,>(
    setter: Dispatch<SetStateAction<T[]>>,
    factory: () => T,
  ) => {
    setter((prev: T[]) => [...prev, factory()]);
  };

  const removeItem = <T,>(
    setter: Dispatch<SetStateAction<T[]>>,
    index: number,
  ) => {
    setter((prev: T[]) => prev.filter((_, idx) => idx !== index));
  };

  const updateItem = <T extends object>(
    setter: Dispatch<SetStateAction<T[]>>,
    index: number,
    field: keyof T,
    value: string,
  ) => {
    setter((prev: T[]) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value } as T;
      return next;
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("saving");
    setFeedback("");

    try {
      const response = await fetch("/api/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          structuredNeed,
          transcript: [
            {
              role: "assistant",
              content: "Questionnaire Helios complété (mode formulaire).",
            },
          ],
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Échec de l'envoi");
      }
      setStatus("done");
      setFeedback("Fiche envoyée vers le webhook n8n.");
    } catch (error) {
      console.error(error);
      setStatus("error");
      setFeedback("Impossible d'envoyer la fiche. Vérifiez la connexion.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.4em] text-emerald-600">Section 1</p>
        <h2 className="text-2xl font-semibold text-zinc-900">Persona & contexte</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm text-zinc-600">
            Nom / Prénom
            <input
              className="mt-1 w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm"
              value={persona.name}
              onChange={(event) => setPersona({ ...persona, name: event.target.value })}
            />
          </label>
          <label className="text-sm text-zinc-600">
            Rôle précis
            <input
              className="mt-1 w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm"
              value={persona.role}
              onChange={(event) => setPersona({ ...persona, role: event.target.value })}
              required
            />
          </label>
          <label className="text-sm text-zinc-600">
            Business unit / portefeuille
            <input
              className="mt-1 w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm"
              value={persona.businessUnit}
              onChange={(event) => setPersona({ ...persona, businessUnit: event.target.value })}
            />
          </label>
          <label className="text-sm text-zinc-600">
            Zone géographique / marchés
            <input
              className="mt-1 w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm"
              value={persona.geography}
              onChange={(event) => setPersona({ ...persona, geography: event.target.value })}
            />
          </label>
          <label className="text-sm text-zinc-600">
            Seniorité
            <input
              className="mt-1 w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm"
              value={persona.seniority}
              onChange={(event) => setPersona({ ...persona, seniority: event.target.value })}
            />
          </label>
          <label className="text-sm text-zinc-600">
            Langues de travail (séparées par virgule)
            <input
              className="mt-1 w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm"
              value={persona.languages}
              onChange={(event) => setPersona({ ...persona, languages: event.target.value })}
            />
          </label>
        </div>
      </section>

      <section className="rounded-3xl border border-amber-100 bg-amber-50 p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.4em] text-amber-600">Section 2</p>
        <h2 className="text-2xl font-semibold text-amber-900">Moments critiques & énergie</h2>
        <p className="text-sm text-amber-800">
          Reformulation de la phase “Workflow & volumes” : l’objectif est d’ouvrir l’échange vers les situations qui
          créent des douleurs, sans enfermer l’utilisateur dans des métriques trop précoces.
        </p>
        <div className="mt-4 space-y-4">
          <label className="text-sm text-amber-900">
            Rituel / étapes clés de vos semaines (une ligne par moment)
            <textarea
              className="mt-1 w-full rounded-2xl border border-amber-200/60 bg-white px-3 py-2 text-sm"
              rows={3}
              value={weeklyCanvas.rituals}
              onChange={(event) => setWeeklyCanvas({ ...weeklyCanvas, rituals: event.target.value })}
            />
          </label>
          <label className="text-sm text-amber-900">
            Où perdez-vous le plus d’énergie ou de confiance ?
            <textarea
              className="mt-1 w-full rounded-2xl border border-amber-200/60 bg-white px-3 py-2 text-sm"
              rows={3}
              value={weeklyCanvas.energyDrains}
              onChange={(event) => setWeeklyCanvas({ ...weeklyCanvas, energyDrains: event.target.value })}
            />
          </label>
          <label className="text-sm text-amber-900">
            Signaux d’alerte qui vous inquiètent (ex: mails tardifs, validations bloquées…)
            <textarea
              className="mt-1 w-full rounded-2xl border border-amber-200/60 bg-white px-3 py-2 text-sm"
              rows={3}
              value={weeklyCanvas.alertSignals}
              onChange={(event) => setWeeklyCanvas({ ...weeklyCanvas, alertSignals: event.target.value })}
            />
          </label>
          <label className="text-sm text-amber-900">
            Outils ou espaces utilisés (séparés par virgules)
            <input
              className="mt-1 w-full rounded-2xl border border-amber-200/60 bg-white px-3 py-2 text-sm"
              value={tooling}
              onChange={(event) => setTooling(event.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="rounded-3xl border border-rose-100 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.4em] text-rose-500">Section 3</p>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-zinc-900">Pain points</h2>
          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm font-semibold text-rose-600"
            onClick={() => addItem(setPainPoints, newPainPoint)}
          >
            <PlusCircle className="h-4 w-4" />
            Ajouter
          </button>
        </div>
        <div className="mt-4 space-y-4">
          {painPoints.map((point, index) => (
            <div key={`pain-${index}`} className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 space-y-3">
              <div className="flex items-center justify-between text-sm font-semibold text-rose-700">
                Irritant #{index + 1}
                {painPoints.length > 1 && (
                  <button type="button" onClick={() => removeItem(setPainPoints, index)} className="text-rose-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-xs uppercase tracking-wide text-rose-500">
                  Thème
                  <input
                    className="mt-1 w-full rounded-xl border border-rose-100 bg-white px-3 py-2 text-sm"
                    value={point.theme}
                    onChange={(event) =>
                      updateItem(setPainPoints, index, "theme", event.target.value)
                    }
                    required={index === 0}
                  />
                </label>
                <label className="text-xs uppercase tracking-wide text-rose-500">
                  KPI affecté (optionnel)
                  <input
                    className="mt-1 w-full rounded-xl border border-rose-100 bg-white px-3 py-2 text-sm"
                    value={point.kpiAffected}
                    onChange={(event) =>
                      updateItem(setPainPoints, index, "kpiAffected", event.target.value)
                    }
                  />
                </label>
              </div>
              <label className="text-xs uppercase tracking-wide text-rose-500">
                Description / impact
                <textarea
                  className="mt-1 w-full rounded-xl border border-rose-100 bg-white px-3 py-2 text-sm"
                  rows={2}
                  value={point.impact}
                  onChange={(event) =>
                    updateItem(setPainPoints, index, "impact", event.target.value)
                  }
                />
              </label>
              <label className="text-xs uppercase tracking-wide text-rose-500">
                Cause racine supposée
                <textarea
                  className="mt-1 w-full rounded-xl border border-rose-100 bg-white px-3 py-2 text-sm"
                  rows={2}
                  value={point.rootCause}
                  onChange={(event) =>
                    updateItem(setPainPoints, index, "rootCause", event.target.value)
                  }
                />
              </label>
              <label className="text-xs uppercase tracking-wide text-rose-500">
                Fréquence
                <select
                  className="mt-1 w-full rounded-xl border border-rose-100 bg-white px-3 py-2 text-sm"
                  value={point.frequency}
                  onChange={(event) =>
                    updateItem(setPainPoints, index, "frequency", event.target.value)
                  }
                >
                  <option value="low">Faible</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Élevée</option>
                </select>
              </label>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-sky-500">Section 4</p>
            <h2 className="text-2xl font-semibold text-zinc-900">Cartographie données</h2>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm font-semibold text-sky-600"
            onClick={() => addItem(setDataSources, newSource)}
          >
            <PlusCircle className="h-4 w-4" />
            Ajouter
          </button>
        </div>
        <div className="mt-4 space-y-4">
          {dataSources.map((source, index) => (
            <div key={`source-${index}`} className="rounded-2xl border border-sky-100 bg-sky-50/60 p-4 space-y-3">
              <div className="flex items-center justify-between text-sm font-semibold text-sky-700">
                Source #{index + 1}
                {dataSources.length > 1 && (
                  <button type="button" onClick={() => removeItem(setDataSources, index)} className="text-sky-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-xs uppercase tracking-wide text-sky-500">
                  Nom / lien
                  <input
                    className="mt-1 w-full rounded-xl border border-sky-100 bg-white px-3 py-2 text-sm"
                    value={source.label}
                    onChange={(event) =>
                      updateItem(setDataSources, index, "label", event.target.value)
                    }
                  />
                </label>
                <label className="text-xs uppercase tracking-wide text-sky-500">
                  Localisation
                  <select
                    className="mt-1 w-full rounded-xl border border-sky-100 bg-white px-3 py-2 text-sm"
                    value={source.location}
                    onChange={(event) =>
                      updateItem(
                        setDataSources,
                        index,
                        "location",
                        event.target.value as DataSourceForm["location"],
                      )
                    }
                  >
                    <option value="SharePoint">SharePoint</option>
                    <option value="Teams">Teams</option>
                    <option value="OneDrive">OneDrive</option>
                    <option value="BusinessApp">Outil métier</option>
                    <option value="Email">Email</option>
                    <option value="Local">Dossier local</option>
                    <option value="Other">Autre</option>
                  </select>
                </label>
                <label className="text-xs uppercase tracking-wide text-sky-500">
                  Type de données
                  <input
                    className="mt-1 w-full rounded-xl border border-sky-100 bg-white px-3 py-2 text-sm"
                    value={source.dataType}
                    onChange={(event) =>
                      updateItem(setDataSources, index, "dataType", event.target.value)
                    }
                  />
                </label>
                <label className="text-xs uppercase tracking-wide text-sky-500">
                  Sensibilité
                  <select
                    className="mt-1 w-full rounded-xl border border-sky-100 bg-white px-3 py-2 text-sm"
                    value={source.sensitivity}
                    onChange={(event) =>
                      updateItem(
                        setDataSources,
                        index,
                        "sensitivity",
                        event.target.value as DataSourceForm["sensitivity"],
                      )
                    }
                  >
                    <option value="public">Publique</option>
                    <option value="internal">Interne</option>
                    <option value="confidential">Confidentielle</option>
                  </select>
                </label>
                <label className="text-xs uppercase tracking-wide text-sky-500">
                  Volume approximatif
                  <input
                    className="mt-1 w-full rounded-xl border border-sky-100 bg-white px-3 py-2 text-sm"
                    value={source.approximateVolume}
                    onChange={(event) =>
                      updateItem(setDataSources, index, "approximateVolume", event.target.value)
                    }
                  />
                </label>
                <label className="text-xs uppercase tracking-wide text-sky-500">
                  Fréquence de mise à jour
                  <input
                    className="mt-1 w-full rounded-xl border border-sky-100 bg-white px-3 py-2 text-sm"
                    value={source.refreshRate}
                    onChange={(event) =>
                      updateItem(setDataSources, index, "refreshRate", event.target.value)
                    }
                  />
                </label>
                <label className="text-xs uppercase tracking-wide text-sky-500">
                  Besoin de l&apos;agent
                  <select
                    className="mt-1 w-full rounded-xl border border-sky-100 bg-white px-3 py-2 text-sm"
                    value={source.ingestionNeed}
                    onChange={(event) =>
                      updateItem(
                        setDataSources,
                        index,
                        "ingestionNeed",
                        event.target.value as DataSourceForm["ingestionNeed"],
                      )
                    }
                  >
                    <option value="read">Lecture</option>
                    <option value="write">Écriture</option>
                    <option value="bi-directional">Bi-directionnel</option>
                  </select>
                </label>
                <label className="text-xs uppercase tracking-wide text-sky-500">
                  Owner / équipe
                  <input
                    className="mt-1 w-full rounded-xl border border-sky-100 bg-white px-3 py-2 text-sm"
                    value={source.owner}
                    onChange={(event) =>
                      updateItem(setDataSources, index, "owner", event.target.value)
                    }
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-emerald-500">Section 5</p>
            <h2 className="text-2xl font-semibold text-zinc-900">Opportunités Copilot</h2>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600"
            onClick={() => addItem(setOpportunities, newOpportunity)}
          >
            <PlusCircle className="h-4 w-4" />
            Ajouter
          </button>
        </div>
        <div className="mt-4 space-y-4">
          {opportunities.map((opportunity, index) => (
            <div key={`opp-${index}`} className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 space-y-3">
              <div className="flex items-center justify-between text-sm font-semibold text-emerald-700">
                Cas #{index + 1}
                {opportunities.length > 1 && (
                  <button type="button" onClick={() => removeItem(setOpportunities, index)} className="text-emerald-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <label className="text-xs uppercase tracking-wide text-emerald-500">
                Nom / objectif
                <input
                  className="mt-1 w-full rounded-xl border border-emerald-100 bg-white px-3 py-2 text-sm"
                  value={opportunity.name}
                  onChange={(event) =>
                    updateItem(setOpportunities, index, "name", event.target.value)
                  }
                />
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-xs uppercase tracking-wide text-emerald-500">
                  Déclencheur
                  <input
                    className="mt-1 w-full rounded-xl border border-emerald-100 bg-white px-3 py-2 text-sm"
                    value={opportunity.trigger}
                    onChange={(event) =>
                      updateItem(setOpportunities, index, "trigger", event.target.value)
                    }
                  />
                </label>
                <label className="text-xs uppercase tracking-wide text-emerald-500">
                  Phase du parcours
                  <select
                    className="mt-1 w-full rounded-xl border border-emerald-100 bg-white px-3 py-2 text-sm"
                    value={opportunity.phase}
                    onChange={(event) =>
                      updateItem(
                        setOpportunities,
                        index,
                        "phase",
                        event.target.value as OpportunityForm["phase"],
                      )
                    }
                  >
                    <option value="discover">Discover</option>
                    <option value="design">Design</option>
                    <option value="execute">Execute</option>
                    <option value="report">Report</option>
                  </select>
                </label>
              </div>
              <label className="text-xs uppercase tracking-wide text-emerald-500">
                Entrées nécessaires (séparer par virgule)
                <input
                  className="mt-1 w-full rounded-xl border border-emerald-100 bg-white px-3 py-2 text-sm"
                  value={opportunity.inputSignals}
                  onChange={(event) =>
                    updateItem(
                      setOpportunities,
                      index,
                      "inputSignals",
                      event.target.value,
                    )
                  }
                />
              </label>
              <label className="text-xs uppercase tracking-wide text-emerald-500">
                Sortie attendue
                <textarea
                  className="mt-1 w-full rounded-xl border border-emerald-100 bg-white px-3 py-2 text-sm"
                  rows={2}
                  value={opportunity.expectedOutput}
                  onChange={(event) =>
                    updateItem(
                      setOpportunities,
                      index,
                      "expectedOutput",
                      event.target.value,
                    )
                  }
                />
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-xs uppercase tracking-wide text-emerald-500">
                  KPI de succès
                  <input
                    className="mt-1 w-full rounded-xl border border-emerald-100 bg-white px-3 py-2 text-sm"
                    value={opportunity.successMetric}
                    onChange={(event) =>
                      updateItem(
                        setOpportunities,
                        index,
                        "successMetric",
                        event.target.value,
                      )
                    }
                  />
                </label>
                <label className="text-xs uppercase tracking-wide text-emerald-500">
                  Priorité
                  <select
                    className="mt-1 w-full rounded-xl border border-emerald-100 bg-white px-3 py-2 text-sm"
                    value={opportunity.priority}
                    onChange={(event) =>
                      updateItem(
                        setOpportunities,
                        index,
                        "priority",
                        event.target.value as OpportunityForm["priority"],
                      )
                    }
                  >
                    <option value="must-have">Must-have</option>
                    <option value="should-have">Should-have</option>
                    <option value="nice-to-have">Nice-to-have</option>
                  </select>
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-purple-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-purple-500">Section 6</p>
            <h2 className="text-2xl font-semibold text-zinc-900">Automatisations idéales</h2>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm font-semibold text-purple-600"
            onClick={() => addItem(setAutomations, newAutomation)}
          >
            <PlusCircle className="h-4 w-4" />
            Ajouter
          </button>
        </div>
        <div className="mt-4 space-y-4">
          {automations.map((automation, index) => (
            <div key={`auto-${index}`} className="rounded-2xl border border-purple-100 bg-purple-50/60 p-4 space-y-3">
              <div className="flex items-center justify-between text-sm font-semibold text-purple-700">
                Action #{index + 1}
                {automations.length > 1 && (
                  <button type="button" onClick={() => removeItem(setAutomations, index)} className="text-purple-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-xs uppercase tracking-wide text-purple-500">
                  Système cible
                  <input
                    className="mt-1 w-full rounded-xl border border-purple-100 bg-white px-3 py-2 text-sm"
                    value={automation.system}
                    onChange={(event) =>
                      updateItem(setAutomations, index, "system", event.target.value)
                    }
                  />
                </label>
                <label className="text-xs uppercase tracking-wide text-purple-500">
                  Propriétaire
                  <input
                    className="mt-1 w-full rounded-xl border border-purple-100 bg-white px-3 py-2 text-sm"
                    value={automation.owner}
                    onChange={(event) =>
                      updateItem(setAutomations, index, "owner", event.target.value)
                    }
                  />
                </label>
              </div>
              <label className="text-xs uppercase tracking-wide text-purple-500">
                Action souhaitée
                <textarea
                  className="mt-1 w-full rounded-xl border border-purple-100 bg-white px-3 py-2 text-sm"
                  rows={2}
                  value={automation.action}
                  onChange={(event) =>
                    updateItem(setAutomations, index, "action", event.target.value)
                  }
                />
              </label>
              <label className="text-xs uppercase tracking-wide text-purple-500">
                Dépendances / validations
                <textarea
                  className="mt-1 w-full rounded-xl border border-purple-100 bg-white px-3 py-2 text-sm"
                  rows={2}
                  value={automation.dependency}
                  onChange={(event) =>
                    updateItem(
                      setAutomations,
                      index,
                      "dependency",
                      event.target.value,
                    )
                  }
                />
              </label>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">Section 7</p>
        <h2 className="text-2xl font-semibold text-zinc-900">Gouvernance & résultats attendus</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-xs uppercase tracking-wide text-zinc-500">
            Considérations sécurité
            <textarea
              className="mt-1 w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm"
              rows={2}
              value={security}
              onChange={(event) => setSecurity(event.target.value)}
            />
          </label>
          <label className="text-xs uppercase tracking-wide text-zinc-500">
            Contraintes compliance
            <textarea
              className="mt-1 w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm"
              rows={2}
              value={compliance}
              onChange={(event) => setCompliance(event.target.value)}
            />
          </label>
          <label className="text-xs uppercase tracking-wide text-zinc-500">
            Approbations requises
            <textarea
              className="mt-1 w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm"
              rows={2}
              value={approvals}
              onChange={(event) => setApprovals(event.target.value)}
            />
          </label>
          <label className="text-xs uppercase tracking-wide text-zinc-500">
            Plan de conduite du changement
            <textarea
              className="mt-1 w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm"
              rows={2}
              value={changePlan}
              onChange={(event) => setChangePlan(event.target.value)}
            />
          </label>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="text-xs uppercase tracking-wide text-zinc-500 md:col-span-2">
            KPIs de succès (séparer par virgule ou retour à la ligne)
            <textarea
              className="mt-1 w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm"
              rows={2}
              value={kpis}
              onChange={(event) => setKpis(event.target.value)}
            />
          </label>
          <label className="text-xs uppercase tracking-wide text-zinc-500">
            Horizon temporel
            <input
              className="mt-1 w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm"
              value={horizon}
              onChange={(event) => setHorizon(event.target.value)}
            />
          </label>
        </div>
        <label className="mt-4 block text-xs uppercase tracking-wide text-zinc-500">
          Plan d’adoption (jalons, audiences pilotes…)
          <textarea
            className="mt-1 w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm"
            rows={2}
            value={adoptionPlan}
            onChange={(event) => setAdoptionPlan(event.target.value)}
          />
        </label>
      </section>

      <section className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.4em] text-emerald-500">Section 8</p>
        <h2 className="text-2xl font-semibold text-zinc-900">Strategic fit & next steps</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="text-xs uppercase tracking-wide text-zinc-500">
            Importance
            <select
              className="mt-1 w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm"
              value={importance}
              onChange={(event) => setImportance(event.target.value as FitLevel)}
            >
              <option value="low">Faible</option>
              <option value="medium">Moyenne</option>
              <option value="high">Élevée</option>
            </select>
          </label>
          <label className="text-xs uppercase tracking-wide text-zinc-500">
            Fréquence
            <select
              className="mt-1 w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm"
              value={frequency}
              onChange={(event) => setFrequency(event.target.value as FitLevel)}
            >
              <option value="low">Faible</option>
              <option value="medium">Moyenne</option>
              <option value="high">Élevée</option>
            </select>
          </label>
          <label className="text-xs uppercase tracking-wide text-zinc-500">
            Prochain jalon / pilote
            <input
              className="mt-1 w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm"
              value={pilotAnchor}
              onChange={(event) => setPilotAnchor(event.target.value)}
            />
          </label>
        </div>
        <label className="mt-4 block text-xs uppercase tracking-wide text-zinc-500">
          Pourquoi ce positionnement dans la matrice ?
          <textarea
            className="mt-1 w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm"
            rows={2}
            value={rationale}
            onChange={(event) => setRationale(event.target.value)}
          />
        </label>
        <label className="mt-4 block text-xs uppercase tracking-wide text-zinc-500">
          Prochaines étapes (une par ligne)
          <textarea
            className="mt-1 w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm"
            rows={2}
            value={nextSteps}
            onChange={(event) => setNextSteps(event.target.value)}
          />
        </label>
        <label className="mt-4 block text-xs uppercase tracking-wide text-zinc-500">
          Note de synthèse (optionnel)
          <textarea
            className="mt-1 w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm"
            rows={2}
            value={summaryNote}
            onChange={(event) => setSummaryNote(event.target.value)}
          />
        </label>
      </section>

      <div className="flex flex-col gap-3 rounded-3xl border border-zinc-200 bg-white/80 p-6 shadow-sm">
        <button
          type="submit"
          disabled={status === "saving"}
          className={cn(
            "flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition",
            status === "saving" ? "opacity-70" : "hover:bg-emerald-700",
          )}
        >
          {status === "saving" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Envoyer la fiche structurée
        </button>
        {feedback && (
          <div
            className={cn(
              "flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm",
              status === "done"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-800",
            )}
          >
            {status === "done" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {feedback}
          </div>
        )}
      </div>
    </form>
  );
};

