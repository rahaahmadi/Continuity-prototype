import { useCallback, useEffect, useRef, useState } from "react";
import {
  Copy,
  PanelLeft,
  PanelLeftClose,
  Trash2,
  Download,
  FileText,
  Loader2,
  Upload,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import DocumentExplorer, { type ExplorerCategory } from "@/components/dashboard/DocumentExplorer";
import DocumentSummarySidebar from "@/components/dashboard/DocumentSummarySidebar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  deleteDocument,
  downloadDocument,
  getDocumentSummary,
  listDocuments,
  uploadDocument,
  type DocumentResponse,
} from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

const POLL_INTERVAL_MS = 2000;

export default function DocumentRepository() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [explorerOpen, setExplorerOpen] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<ExplorerCategory>(null);
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Summary sidebar
  const [summaryDoc, setSummaryDoc] = useState<{ id: string; name: string } | null>(null);
  const [summaryContent, setSummaryContent] = useState<string | null>(null);
  const [summaryStatus, setSummaryStatus] = useState<"idle" | "loading" | "ready" | "pending">("idle");
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const processingPollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchDocuments = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const { documents: docs } = await listDocuments(token);
      setDocuments(docs);
    } catch {
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    if (!token) return;
    if (uploading) return;
    const hasProcessingDocs = documents.some((doc) => doc.classification === null);
    if (!hasProcessingDocs) {
      if (processingPollTimerRef.current) {
        clearTimeout(processingPollTimerRef.current);
        processingPollTimerRef.current = null;
      }
      return;
    }

    if (processingPollTimerRef.current) return;

    const pollForProcessedDocuments = async () => {
      try {
        const { documents: docs } = await listDocuments(token);
        setDocuments(docs);
      } catch {
        // Keep polling quietly while backend processing continues.
      } finally {
        processingPollTimerRef.current = null;
      }
    };

    processingPollTimerRef.current = setTimeout(pollForProcessedDocuments, POLL_INTERVAL_MS);
  }, [documents, token, uploading]);

  const filteredDocs =
    selectedCategory === null
      ? documents
      : documents.filter((d) => d.classification === selectedCategory);

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !token) return;
    const fileList = Array.from(files);
    const placeholders: DocumentResponse[] = fileList.map((file, index) => ({
      id: `uploading-${Date.now()}-${index}-${file.name}`,
      filename: file.name,
      content_type: file.type || "application/octet-stream",
      size_bytes: file.size,
      created_at: new Date().toISOString(),
      classification: null,
      summary: null,
      summary_status: "none",
      insights: null,
      insights_status: "none",
    }));

    setUploading(true);
    setDocuments((prev) => [...placeholders, ...prev]);
    try {
      const failedUploads: { name: string; reason: string }[] = [];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const placeholderId = placeholders[i].id;
        try {
          const uploadedDocument = await uploadDocument(token, file);
          setDocuments((prev) =>
            prev.map((doc) => (doc.id === placeholderId ? uploadedDocument : doc)),
          );
        } catch (err) {
          const reason =
            err instanceof Error && err.message.trim()
              ? err.message.trim()
              : "Upload failed";
          failedUploads.push({ name: file.name, reason });
          setDocuments((prev) => prev.filter((doc) => doc.id !== placeholderId));
        }
      }

      await fetchDocuments();

      if (failedUploads.length > 0) {
        const first = failedUploads[0];
        const moreCount = failedUploads.length - 1;
        toast({
          variant: "destructive",
          title: `Failed to upload ${failedUploads.length} file${failedUploads.length > 1 ? "s" : ""}`,
          description:
            moreCount > 0
              ? `${first.name}: ${first.reason}. +${moreCount} more.`
              : `${first.name}: ${first.reason}`,
        });
      }
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (doc: DocumentResponse) => {
    if (!token || !confirm(`Delete "${doc.filename}"?`)) return;
    try {
      await deleteDocument(token, doc.id);
      if (summaryDoc?.id === doc.id) {
        setSummaryDoc(null);
        setSummaryContent(null);
        setSummaryStatus("idle");
      }
      await fetchDocuments();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const handleDownload = async (doc: DocumentResponse) => {
    if (!token) return;
    try {
      await downloadDocument(token, doc.id, doc.filename);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Download failed");
    }
  };

  const fetchSummary = useCallback(
    async (documentId: string) => {
      if (!token) return;
      setSummaryStatus("loading");
      try {
        const res = await getDocumentSummary(token, documentId);
        if (res.status === "ready" && res.summary) {
          setSummaryContent(res.summary);
          setSummaryStatus("ready");
          if (pollTimerRef.current) {
            clearTimeout(pollTimerRef.current);
            pollTimerRef.current = null;
          }
        } else {
          setSummaryContent(null);
          setSummaryStatus("pending");
          pollTimerRef.current = setTimeout(() => fetchSummary(documentId), POLL_INTERVAL_MS);
        }
      } catch {
        setSummaryStatus("idle");
        setSummaryContent(null);
      }
    },
    [token],
  );

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      if (processingPollTimerRef.current) clearTimeout(processingPollTimerRef.current);
    };
  }, []);

  const handleSummary = (doc: DocumentResponse) => {
    setSummaryDoc({ id: doc.id, name: doc.filename });
    setSummaryContent(null);
    fetchSummary(doc.id);
  };

  const closeSummary = () => {
    setSummaryDoc(null);
    setSummaryContent(null);
    setSummaryStatus("idle");
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  const summaryOpen = !!summaryDoc;
  const showDateColumn = !summaryOpen;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="flex flex-1 h-full min-w-0">
      {explorerOpen ? (
        <DocumentExplorer
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          headerAction={
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => setExplorerOpen(false)}
              aria-label="Close explorer"
            >
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          }
          className="h-full"
        />
      ) : (
        <div className="w-12 shrink-0 border-r border-border bg-card flex flex-col items-center pt-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setExplorerOpen(true)}
            aria-label="Open explorer"
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex flex-1 min-w-0 flex-col h-full">
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-8 max-w-4xl space-y-6">
            <div className="p-6 rounded-xl border border-border bg-card shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-foreground">Document Repository</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Store, organize, and manage the files tied to your business profile.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" className="gap-2" disabled>
                    <Copy className="h-4 w-4" /> Import
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <Button
                    className="gradient-gold text-accent-foreground shadow-gold hover:opacity-90 gap-2"
                    onClick={handleUploadClick}
                  >
                    <Upload className="h-4 w-4" />
                    Upload Files
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {loading ? (
                <div className="p-8 flex items-center justify-center text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Loading documents…
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document</TableHead>
                      {showDateColumn && <TableHead>Date</TableHead>}
                      <TableHead className="w-[120px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={showDateColumn ? 3 : 2} className="text-muted-foreground text-center py-8">
                          No documents
                          {selectedCategory !== null && " in this category"}
                          .
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDocs.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell className={cn("font-medium", doc.classification === null && "text-muted-foreground")}>
                            <div className="flex items-center gap-2">
                              {doc.classification === null && (
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden="true" />
                              )}
                              <span>{doc.filename}</span>
                            </div>
                          </TableCell>
                          {showDateColumn && (
                            <TableCell className="text-muted-foreground text-sm">
                              {formatDate(doc.created_at)}
                            </TableCell>
                          )}
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleSummary(doc)}
                                aria-label="Summary"
                                disabled={doc.classification === null}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleDownload(doc)}
                                aria-label="Download"
                                disabled={doc.classification === null}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleDelete(doc)}
                                aria-label="Delete"
                                disabled={doc.classification === null}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </div>
      </div>

      <DocumentSummarySidebar
        isOpen={summaryOpen}
        documentName={summaryDoc?.name ?? null}
        summary={summaryContent}
        status={summaryStatus}
        onClose={closeSummary}
        className="h-full"
      />
    </div>
  );
}
