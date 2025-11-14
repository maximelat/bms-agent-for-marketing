export type PriorityLevel = "must-have" | "should-have" | "nice-to-have";
export type FitLevel = "low" | "medium" | "high";

export interface StructuredNeed {
  persona: {
    name?: string;
    role?: string;
    businessUnit?: string;
    geography?: string;
    seniority?: string;
    languages?: string[];
  };
  workflow: {
    keyActivities?: string[];
    currentTools?: string[];
    weeklyVolume?: string;
    cycleTimePain?: string;
  };
  painPoints: {
    theme: string;
    rootCause: string;
    impact: string;
    frequency: FitLevel;
    kpiAffected?: string;
  }[];
  dataFootprint: {
    sources: {
      label: string;
      location: "SharePoint" | "OneDrive" | "Teams" | "Local" | "BusinessApp" | "Email" | "Other";
      dataType: string;
      sensitivity: "public" | "internal" | "confidential";
      approximateVolume: string;
      refreshRate: string;
      ingestionNeed: "read" | "write" | "bi-directional";
      owner?: string;
    }[];
    manualFilesVolume?: string;
    qualityConcerns?: string;
  };
  copilotOpportunities: {
    name: string;
    phase: "discover" | "design" | "execute" | "report";
    trigger: string;
    inputSignals: string[];
    expectedOutput: string;
    successMetric: string;
    priority: PriorityLevel;
  }[];
  automationWishlist: {
    system: string;
    action: string;
    dependency: string;
    owner?: string;
  }[];
  governance: {
    securityConsiderations?: string;
    complianceConstraints?: string;
    approvals?: string;
    changeManagement?: string;
  };
  expectedOutcomes: {
    successKPIs: string[];
    timeline?: string;
    adoptionPlan?: string;
  };
  strategicFit: {
    importance: FitLevel;
    frequency: FitLevel;
    rationale: string;
  };
  summaryNote?: string;
  nextSteps: string[];
}

export const defaultStructuredNeed: StructuredNeed = {
  persona: {},
  workflow: {},
  painPoints: [],
  dataFootprint: { sources: [] },
  copilotOpportunities: [],
  automationWishlist: [],
  governance: {},
  expectedOutcomes: { successKPIs: [] },
  strategicFit: {
    importance: "medium",
    frequency: "medium",
    rationale: "",
  },
  nextSteps: [],
};

