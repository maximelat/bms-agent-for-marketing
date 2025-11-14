import { StructuredNeed } from "./structuredNeed";
import { UseCaseCanvas } from "./useCaseCanvas";

// UUID compatible navigateur
const generateUUID = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback pour environnements sans crypto.randomUUID
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const convertToCanvas = (
  need: StructuredNeed,
  submittedBy: string,
): UseCaseCanvas => {
  // Extraire le problème principal des pain points
  const problemToSolve =
    need.painPoints.length > 0
      ? need.painPoints
          .map((p) => `${p.theme}: ${p.impact}`)
          .join(". ")
      : "À définir";

  // Description du use case basée sur les opportunités Copilot
  const useCaseDescription =
    need.copilotOpportunities.length > 0
      ? need.copilotOpportunities
          .map((opp) => `${opp.name}: ${opp.trigger} → ${opp.expectedOutput}`)
          .join(". ")
      : "À définir";

  // Données et produits utilisés
  const dataAndProductUsed = [
    ...need.dataFootprint.sources.map(
      (s) => `${s.label} (${s.location})`,
    ),
    ...(need.workflow.currentTools ?? []),
  ];

  // Business objective
  const businessObjective =
    need.expectedOutcomes.successKPIs.length > 0
      ? `Améliorer l'efficacité via Copilot M365. KPIs: ${need.expectedOutcomes.successKPIs.join(", ")}`
      : "À définir";

  // Key results basés sur les métriques de succès
  const keyResults = need.copilotOpportunities
    .filter((opp) => opp.successMetric)
    .map((opp) => `${opp.name}: ${opp.successMetric}`);

  // Stakeholders
  const stakeholders = [
    ...(need.persona.role ? [need.persona.role] : []),
    ...(need.dataFootprint.sources
      .map((s) => s.owner)
      .filter(Boolean) as string[]),
    ...(need.automationWishlist
      .map((a) => a.owner)
      .filter(Boolean) as string[]),
  ];

  return {
    id: generateUUID(),
    createdAt: new Date().toISOString(),
    submittedBy,
    problemToSolve,
    useCaseDescription,
    dataAndProductUsed,
    businessObjective,
    keyResults,
    stakeholders: [...new Set(stakeholders)], // déduplique
    strategicFit: need.strategicFit,
    votes: 0,
    voters: [],
  };
};

