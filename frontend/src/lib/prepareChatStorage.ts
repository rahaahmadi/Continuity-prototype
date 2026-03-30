/**
 * Browser-only persistence for Prepare chat (localStorage).
 */

export type PrepareChatMessageUpload = {
  documentId: string | null;
  filename: string;
  fileTypeLabel: string;
  uploading: boolean;
  documentCategory: string | null;
  error?: string;
  pollExceeded?: boolean;
};

export type PrepareChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  timestamp: Date;
  upload?: PrepareChatMessageUpload;
  /** When true (assistant only), show document category chips inside this message bubble. */
  categoryPicker?: boolean;
};

const STORAGE_KEY_PREFIX = "continuity_prepare_chat:v1";

export function prepareChatStorageKey(userId: string | null | undefined): string {
  return `${STORAGE_KEY_PREFIX}:${userId ?? "guest"}`;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function parseUpload(raw: unknown): PrepareChatMessageUpload | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.filename !== "string" || typeof raw.fileTypeLabel !== "string") return null;
  if (typeof raw.uploading !== "boolean") return null;
  if (!(raw.documentId === null || typeof raw.documentId === "string")) return null;
  if (!(raw.documentCategory === null || typeof raw.documentCategory === "string")) return null;
  const upload: PrepareChatMessageUpload = {
    documentId: raw.documentId,
    filename: raw.filename,
    fileTypeLabel: raw.fileTypeLabel,
    uploading: raw.uploading,
    documentCategory: raw.documentCategory,
  };
  if (typeof raw.error === "string") upload.error = raw.error;
  if (raw.pollExceeded === true) upload.pollExceeded = true;
  return upload;
}

/** Recover after reload: in-flight uploads cannot resume. */
export function normalizeRestoredPrepareChatMessages(
  messages: PrepareChatMessage[],
): PrepareChatMessage[] {
  return messages.map(m => {
    if (!m.upload || !m.upload.uploading) return m;
    if (m.upload.documentId) {
      return { ...m, upload: { ...m.upload, uploading: false } };
    }
    return {
      ...m,
      content: m.content,
      upload: {
        ...m.upload,
        uploading: false,
        error: m.upload.error ?? "Upload was interrupted. Try uploading the file again.",
      },
    };
  });
}

export function parsePrepareChat(json: string): PrepareChatMessage[] | null {
  try {
    const data: unknown = JSON.parse(json);
    if (!Array.isArray(data)) return null;
    const out: PrepareChatMessage[] = [];
    for (const item of data) {
      if (!isRecord(item)) return null;
      if (item.role !== "assistant" && item.role !== "user") return null;
      if (typeof item.id !== "string" || typeof item.content !== "string") return null;
      if (typeof item.timestamp !== "string" || Number.isNaN(Date.parse(item.timestamp))) {
        return null;
      }
      const msg: PrepareChatMessage = {
        id: item.id,
        role: item.role,
        content: item.content,
        timestamp: new Date(item.timestamp),
      };
      if (item.upload !== undefined) {
        const upload = parseUpload(item.upload);
        if (upload === null) return null;
        msg.upload = upload;
      }
      if (item.categoryPicker === true) {
        msg.categoryPicker = true;
      }
      out.push(msg);
    }
    return normalizeRestoredPrepareChatMessages(out);
  } catch {
    return null;
  }
}

type UploadDto = Omit<PrepareChatMessageUpload, never>;

type MessageDto = {
  id: string;
  role: "assistant" | "user";
  content: string;
  timestamp: string;
  upload?: UploadDto;
  categoryPicker?: boolean;
};

export function stringifyPrepareChat(messages: PrepareChatMessage[]): string {
  const dto: MessageDto[] = messages.map(m => {
    const row: MessageDto = {
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp.toISOString(),
    };
    if (m.upload) {
      row.upload = { ...m.upload };
    }
    if (m.categoryPicker) {
      row.categoryPicker = true;
    }
    return row;
  });
  return JSON.stringify(dto);
}
