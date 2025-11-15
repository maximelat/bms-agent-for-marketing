export type FitLevel = "low" | "medium" | "high";

export interface UseCaseCanvas {
  id: string;
  createdAt: string;
  submittedBy: string; // email de l'interviewé
  
  // Contexte rapide
  Persona: string; // Description courte du persona
  painpoint: string; // Résumé pain points
  opportunitécopilot: string; // Pourquoi cet agent ?
  
  // General
  problemToSolve: string;
  useCaseDescription: string;
  dataAndProductUsed: string[];
  
  // Objectives & key results
  businessObjective: string;
  keyResults: string[];
  stakeholders: string[];
  
  // Strategic fit
  strategicFit: {
    importance: FitLevel;
    frequency: FitLevel;
    rationale: string;
  };
  
  // Votes (pour la phase de priorisation communautaire)
  votes: number;
  voters: string[]; // emails des votants
}

export const defaultUseCaseCanvas: UseCaseCanvas = {
  id: "",
  createdAt: "",
  submittedBy: "",
  Persona: "",
  painpoint: "",
  opportunitécopilot: "",
  problemToSolve: "",
  useCaseDescription: "",
  dataAndProductUsed: [],
  businessObjective: "",
  keyResults: [],
  stakeholders: [],
  strategicFit: {
    importance: "medium",
    frequency: "medium",
    rationale: "",
  },
  votes: 0,
  voters: [],
};

