/**
 * Persist Prepare flow stage (business vs documents, active category) in localStorage.
 */

import { DOCUMENT_LABELS, type DocumentLabel } from "@/constants/documentLabels";

export type PrepareFlowStage = "business" | "documents";

export type PrepareFlowState = {
  stage: PrepareFlowStage;
  activeDocumentCategory: DocumentLabel | null;
  completedDocumentCategories: DocumentLabel[];
};

export const DEFAULT_PREPARE_FLOW: PrepareFlowState = {
  stage: "business",
  activeDocumentCategory: null,
  completedDocumentCategories: [],
};

export function prepareFlowStorageKey(userId: string | null | undefined): string {
  return `continuity_prepare_flow:v1:${userId ?? "guest"}`;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isDocumentLabel(v: unknown): v is DocumentLabel {
  return typeof v === "string" && (DOCUMENT_LABELS as readonly string[]).includes(v);
}

export function parsePrepareFlow(json: string): PrepareFlowState | null {
  try {
    const data: unknown = JSON.parse(json);
    if (!isRecord(data)) return null;
    if (data.stage !== "business" && data.stage !== "documents") return null;
    if (data.activeDocumentCategory !== null && !isDocumentLabel(data.activeDocumentCategory)) {
      return null;
    }
    if (!Array.isArray(data.completedDocumentCategories)) return null;
    const completed: DocumentLabel[] = [];
    for (const item of data.completedDocumentCategories) {
      if (!isDocumentLabel(item)) return null;
      completed.push(item);
    }
    return {
      stage: data.stage,
      activeDocumentCategory:
        data.activeDocumentCategory === null ? null : data.activeDocumentCategory,
      completedDocumentCategories: completed,
    };
  } catch {
    return null;
  }
}

export function stringifyPrepareFlow(flow: PrepareFlowState): string {
  return JSON.stringify(flow);
}
