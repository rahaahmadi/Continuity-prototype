/**
 * API base URL. Set VITE_API_URL in .env (e.g. http://localhost:8000).
 */
export const getApiUrl = () => import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export type UserResponse = {
  id: string;
  email: string;
  is_active: boolean;
  created_at: string;
};

export type LoginResponse = {
  access_token: string;
  token_type: string;
  expires_in_seconds: number;
  user: UserResponse;
};

async function handleResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const data = text ? JSON.parse(text) : {};
      detail =
        data.detail ??
        (Array.isArray(data.detail)
          ? data.detail
              .map((d: { msg?: string }) => d.msg ?? JSON.stringify(d))
              .join(", ")
          : data.detail) ??
        detail;
    } catch {
      if (text) detail = text;
    }
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return text ? JSON.parse(text) : ({} as T);
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${getApiUrl()}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse<LoginResponse>(res);
}

export async function register(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${getApiUrl()}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse<LoginResponse>(res);
}

export async function logout(token: string): Promise<void> {
  const res = await fetch(`${getApiUrl()}/api/auth/logout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok && res.status !== 401) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
}

export async function getMe(token: string): Promise<UserResponse> {
  const res = await fetch(`${getApiUrl()}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<UserResponse>(res);
}

export async function deleteAccount(token: string): Promise<void> {
  const res = await fetch(`${getApiUrl()}/api/auth/account`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok && res.status !== 401) {
    const text = await res.text();
    let detail = res.statusText;
    try {
      const data = text ? JSON.parse(text) : {};
      detail = data.detail ?? detail;
    } catch {
      if (text) detail = text;
    }
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
}

// --- Documents ---

export type DocumentResponse = {
  id: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  created_at: string;
  classification: string | null;
  summary: string | null;
  summary_status: string;
  insights: Record<string, unknown> | null;
  insights_status: string;
};

export type SummaryResponse = {
  summary: string | null;
  status: "ready" | "pending";
};

export type BusinessOverviewResponse = {
  content: string | null;
  status: "none" | "pending" | "ready" | "failed";
};

export type KeyInsightKind =
  | "growth"
  | "risk"
  | "financial"
  | "operations"
  | "customer"
  | "team"
  | "compliance"
  | "opportunity"
  | "other";

export type KeyInsightResponse = {
  title: string;
  description: string;
  kind: KeyInsightKind;
};

export type KeyInsightsResponse = {
  key_insights: KeyInsightResponse[];
  status: "none" | "pending" | "ready" | "failed";
};

export type WidgetPointResponse = {
  period: string;
  value_raw: string;
  value_numeric: number | null;
};

export type BusinessSnapshotWidget = {
  entity_type: string | null;
  years_operating: number | null;
  headcount: number | null;
  trailing_revenue: string | null;
  trailing_ebitda: string | null;
};

export type FinancialHighlightsWidget = {
  ebitda_margin: string | null;
  debt_summary: string[];
  working_capital_flags: string[];
  gross_profit_by_period: WidgetPointResponse[];
  gross_margin_pct_by_period: WidgetPointResponse[];
  cash_and_equivalents_by_period: WidgetPointResponse[];
  ebitda_by_period: WidgetPointResponse[];
  ebitda_margin_pct_by_period: WidgetPointResponse[];
  debt_total_by_period: WidgetPointResponse[];
};

export type TopCustomerWidget = {
  name: string;
  revenue: string | null;
  percentage_of_revenue: string | null;
  period: string | null;
};

export type CustomerConcentrationWidget = {
  top_customers: TopCustomerWidget[];
  percentages: string[];
  risk_tier: string | null;
};

export type BusinessProfileWidgetsResponse = {
  status: "none" | "pending" | "ready";
  readiness_score: number;
  readiness_completed_checks: number;
  readiness_total_checks: number;
  business_snapshot: BusinessSnapshotWidget;
  revenue_trend_points: WidgetPointResponse[];
  financial_highlights: FinancialHighlightsWidget;
  customer_concentration: CustomerConcentrationWidget;
};

export async function listDocuments(token: string): Promise<{ documents: DocumentResponse[] }> {
  const res = await fetch(`${getApiUrl()}/api/documents`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<{ documents: DocumentResponse[] }>(res);
}

export async function getDocument(token: string, documentId: string): Promise<DocumentResponse> {
  const res = await fetch(`${getApiUrl()}/api/documents/${documentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<DocumentResponse>(res);
}

export type PrepareChatMessagePayload = {
  role: "user" | "assistant";
  content: string;
};

export type PrepareChatRequest = {
  messages: PrepareChatMessagePayload[];
  stage: "business" | "documents";
  active_document_category: string | null;
};

export type PrepareChatResponse = {
  assistant_message: string;
};

/** Authenticated LLM turn for Prepare tab (business Q&A or document upload coaching). */
export async function prepareChat(token: string, body: PrepareChatRequest): Promise<PrepareChatResponse> {
  const res = await fetch(`${getApiUrl()}/api/prepare-chat`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return handleResponse<PrepareChatResponse>(res);
}

export async function uploadDocument(token: string, file: File): Promise<DocumentResponse> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${getApiUrl()}/api/documents`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  return handleResponse<DocumentResponse>(res);
}

export async function getDocumentSummary(
  token: string,
  documentId: string,
): Promise<SummaryResponse> {
  const res = await fetch(`${getApiUrl()}/api/documents/${documentId}/summary`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<SummaryResponse>(res);
}

export async function getBusinessOverview(token: string): Promise<BusinessOverviewResponse> {
  const res = await fetch(`${getApiUrl()}/api/business-overview`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<BusinessOverviewResponse>(res);
}

export async function getKeyInsights(token: string): Promise<KeyInsightsResponse> {
  const res = await fetch(`${getApiUrl()}/api/key-insights`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<KeyInsightsResponse>(res);
}

export async function getBusinessProfileWidgets(
  token: string,
): Promise<BusinessProfileWidgetsResponse> {
  const res = await fetch(`${getApiUrl()}/api/business-profile/widgets`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<BusinessProfileWidgetsResponse>(res);
}

export async function deleteDocument(token: string, documentId: string): Promise<void> {
  const res = await fetch(`${getApiUrl()}/api/documents/${documentId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    let detail = res.statusText;
    try {
      const data = text ? JSON.parse(text) : {};
      detail = data.detail ?? detail;
    } catch {
      if (text) detail = text;
    }
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
}

/** Download document file; uses Bearer token. Call with filename for save-as name. */
export async function downloadDocument(
  token: string,
  documentId: string,
  filename: string,
): Promise<void> {
  const res = await fetch(`${getApiUrl()}/api/documents/${documentId}/download`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(res.statusText || "Download failed");
  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition");
  const match = disposition?.match(/filename="?([^";]+)"?/);
  const saveAs = match?.[1] ?? filename;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = saveAs;
  a.click();
  URL.revokeObjectURL(url);
}
