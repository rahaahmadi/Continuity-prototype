/** User-facing file category from MIME type or extension (e.g. for attachment chips). */

export function getFileCategoryLabel(contentType: string, filename = ""): string {
  const ct = (contentType || "").toLowerCase();
  const ext = filename.includes(".") ? (filename.split(".").pop()?.toLowerCase() ?? "") : "";

  if (ct.includes("pdf") || ext === "pdf") return "PDF";
  if (ct.startsWith("image/")) return "IMAGE";
  if (
    ct.includes("spreadsheet") ||
    ct.includes("excel") ||
    ct === "text/csv" ||
    ["csv", "xlsx", "xls", "ods"].includes(ext)
  )
    return "SPREADSHEET";
  if (
    ct.includes("wordprocessingml") ||
    ct.includes("msword") ||
    ct === "application/rtf" ||
    ["doc", "docx", "rtf", "odt"].includes(ext)
  )
    return "DOCUMENT";
  if (
    ct.includes("presentationml") ||
    ct.includes("powerpoint") ||
    ["ppt", "pptx", "odp"].includes(ext)
  )
    return "PRESENTATION";
  if (ct === "text/plain" || ext === "txt") return "TEXT";
  if (ct.includes("zip") || ct.includes("rar") || ["zip", "rar", "7z"].includes(ext))
    return "ARCHIVE";
  return "FILE";
}

/** Solid background for the attachment icon tile (ChatGPT-style per type). */
export function getCategoryIconClass(category: string): string {
  const c = category.toLowerCase();
  if (c === "pdf") return "bg-red-600";
  if (c === "spreadsheet") return "bg-emerald-600";
  if (c === "image") return "bg-sky-600";
  if (c === "document") return "bg-blue-600";
  if (c === "presentation") return "bg-amber-600";
  if (c === "text") return "bg-slate-600";
  if (c === "archive") return "bg-violet-600";
  if (c === "file") return "bg-muted-foreground";
  return "bg-muted-foreground";
}
