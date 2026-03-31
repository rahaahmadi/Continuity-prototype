import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Send, Plus, Mic, Bot, User, Upload, Camera, FileText, Loader2, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getDocument, prepareChat, uploadDocument } from "@/lib/api";
import { DOCUMENT_LABELS, labelToCamelCase, type DocumentLabel } from "@/constants/documentLabels";
import { getFileCategoryLabel, getCategoryIconClass } from "@/lib/fileCategory";
import {
  parsePrepareChat,
  prepareChatStorageKey,
  stringifyPrepareChat,
  type PrepareChatMessage,
  type PrepareChatMessageUpload,
} from "@/lib/prepareChatStorage";
import {
  DEFAULT_PREPARE_FLOW,
  parsePrepareFlow,
  prepareFlowStorageKey,
  stringifyPrepareFlow,
  type PrepareFlowState,
} from "@/lib/prepareFlowStorage";
import { cn } from "@/lib/utils";

const CLASSIFICATION_POLL_MS = 2000;
const CLASSIFICATION_MAX_POLLS = 45;

type Message = PrepareChatMessage;

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content:
      "Welcome to Continuity! I'm here to help you prepare your business for a successful transition. Let's start by understanding your business better.\n\n**First, can you tell me about your business?** What industry are you in, and how long have you been operating?",
    timestamp: new Date(),
  },
];

function renderMarkdownishLine(line: string, key: string, withTopMargin = false) {
  return (
    <p key={key} className={cn(withTopMargin && "mt-2")}>
      {line.split("**").map((part, j) =>
        j % 2 === 1 ? (
          <strong key={`${key}-${j}`}>{part}</strong>
        ) : (
          <span key={`${key}-${j}`}>{part}</span>
        ),
      )}
    </p>
  );
}

function toApiMessages(msgs: Message[]): { role: "user" | "assistant"; content: string }[] {
  return msgs
    .filter(m => m.content.trim().length > 0)
    .map(m => ({ role: m.role, content: m.content.trim() }));
}

const ChatInterface = () => {
  const { token, user, isInitialized } = useAuth();
  const { toast } = useToast();
  const storageKey = useMemo(() => prepareChatStorageKey(user?.id), [user?.id]);
  const flowKey = useMemo(() => prepareFlowStorageKey(user?.id), [user?.id]);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [flow, setFlow] = useState<PrepareFlowState>(DEFAULT_PREPARE_FLOW);
  const [storageHydrated, setStorageHydrated] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const flowRef = useRef<PrepareFlowState>(flow);
  flowRef.current = flow;

  const TEXTAREA_MAX_PX = 200;

  const hasUserTextMessage = useMemo(
    () => messages.some(m => m.role === "user" && m.content.trim().length > 0),
    [messages],
  );

  const pollClassification = useCallback(
    async (documentId: string, messageId: string) => {
      if (!token) return;
      for (let t = 0; t < CLASSIFICATION_MAX_POLLS; t++) {
        await new Promise(r => setTimeout(r, CLASSIFICATION_POLL_MS));
        try {
          const doc = await getDocument(token, documentId);
          if (doc.classification) {
            setMessages(prev =>
              prev.map(m =>
                m.id === messageId && m.upload
                  ? {
                      ...m,
                      upload: { ...m.upload, documentCategory: doc.classification },
                    }
                  : m,
              ),
            );
            return;
          }
        } catch {
          /* keep polling */
        }
      }
      setMessages(prev =>
        prev.map(m =>
          m.id === messageId && m.upload && m.upload.documentCategory == null
            ? { ...m, upload: { ...m.upload, pollExceeded: true } }
            : m,
        ),
      );
    },
    [token],
  );

  const fetchAssistant = useCallback(
    async (history: Message[], flowSnapshot: PrepareFlowState) => {
      if (!token) {
        toast({
          title: "Sign in to continue",
          description: "Create an account or sign in to use the assistant on Prepare.",
          variant: "destructive",
        });
        setIsTyping(false);
        return;
      }
      const apiMessages = toApiMessages(history);
      try {
        const res = await prepareChat(token, {
          messages: apiMessages,
          stage: flowSnapshot.stage,
          active_document_category: flowSnapshot.activeDocumentCategory,
        });
        const showCategoryPicker =
          flowSnapshot.stage === "documents" && flowSnapshot.activeDocumentCategory == null;
        const aiMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: res.assistant_message,
          timestamp: new Date(),
          ...(showCategoryPicker ? { categoryPicker: true } : {}),
        };
        setMessages(prev => {
          const cleared = prev.map(m =>
            m.categoryPicker ? { ...m, categoryPicker: false } : m,
          );
          return [...cleared, aiMsg];
        });
      } catch (e) {
        const message = e instanceof Error ? e.message : "Request failed";
        toast({
          title: "Assistant unavailable",
          description: message,
          variant: "destructive",
        });
      } finally {
        setIsTyping(false);
      }
    },
    [token, toast],
  );

  useEffect(() => {
    if (!isInitialized) return;
    setStorageHydrated(false);
    const raw = localStorage.getItem(storageKey);
    const parsed = raw ? parsePrepareChat(raw) : null;
    let next = parsed && parsed.length > 0 ? parsed : initialMessages;

    const rawFlow = localStorage.getItem(flowKey);
    const flowParsed = rawFlow ? parsePrepareFlow(rawFlow) ?? DEFAULT_PREPARE_FLOW : DEFAULT_PREPARE_FLOW;
    if (
      flowParsed.stage === "documents" &&
      !flowParsed.activeDocumentCategory &&
      !next.some(m => m.categoryPicker)
    ) {
      for (let i = next.length - 1; i >= 0; i--) {
        if (next[i].role === "assistant") {
          next = [...next.slice(0, i), { ...next[i], categoryPicker: true }, ...next.slice(i + 1)];
          break;
        }
      }
    }
    setMessages(next);
    setFlow(flowParsed);

    queueMicrotask(() => {
      setStorageHydrated(true);
      if (token) {
        for (const m of next) {
          const u = m.upload;
          if (u?.documentId && !u.documentCategory && !u.pollExceeded && !u.error) {
            void pollClassification(u.documentId, m.id);
          }
        }
      }
    });
  }, [isInitialized, storageKey, flowKey, token, pollClassification]);

  useEffect(() => {
    if (!storageHydrated) return;
    try {
      localStorage.setItem(storageKey, stringifyPrepareChat(messages));
    } catch {
      /* ignore */
    }
  }, [messages, storageKey, storageHydrated]);

  useEffect(() => {
    if (!storageHydrated) return;
    try {
      localStorage.setItem(flowKey, stringifyPrepareFlow(flow));
    } catch {
      /* ignore */
    }
  }, [flow, flowKey, storageHydrated]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const fullHeight = el.scrollHeight;
    const next = Math.min(fullHeight, TEXTAREA_MAX_PX);
    el.style.height = `${next}px`;
    el.style.overflowY = fullHeight > TEXTAREA_MAX_PX ? "auto" : "hidden";
  }, [input]);

  const queueUpload = useCallback(
    (file: File) => {
      if (!token) {
        toast({
          title: "Sign in to upload",
          description: "You need an account to attach files to Prepare.",
          variant: "destructive",
        });
        return;
      }
      const messageId = crypto.randomUUID();
      const fileTypeLabel = getFileCategoryLabel(file.type, file.name);

      setMessages(prev => [
        ...prev,
        {
          id: messageId,
          role: "user",
          content: "",
          timestamp: new Date(),
          upload: {
            documentId: null,
            filename: file.name,
            fileTypeLabel,
            uploading: true,
            documentCategory: null,
          },
        },
      ]);

      uploadDocument(token, file)
        .then(doc => {
          setMessages(prev =>
            prev.map(m =>
              m.id === messageId && m.upload
                ? {
                    ...m,
                    upload: {
                      ...m.upload,
                      documentId: doc.id,
                      uploading: false,
                      fileTypeLabel: getFileCategoryLabel(doc.content_type, doc.filename),
                      documentCategory: doc.classification,
                    },
                  }
                : m,
            ),
          );
          if (!doc.classification) {
            void pollClassification(doc.id, messageId);
          }
        })
        .catch(err => {
          const message = err instanceof Error ? err.message : "Upload failed";
          setMessages(prev =>
            prev.map(m =>
              m.id === messageId && m.upload
                ? {
                    ...m,
                    upload: {
                      ...m.upload,
                      uploading: false,
                      error: message,
                    },
                  }
                : m,
            ),
          );
          toast({
            title: "Upload failed",
            description: message,
            variant: "destructive",
          });
        });
    },
    [token, toast, pollClassification],
  );

  const handleAttachmentInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    for (const file of Array.from(files)) {
      queueUpload(file);
    }
    e.target.value = "";
  };

  const startDocumentPhase = () => {
    if (isTyping) return;
    if (!token) {
      toast({
        title: "Sign in to continue",
        description: "Create an account or sign in to move on to document uploads.",
        variant: "destructive",
      });
      return;
    }
    const nextFlow: PrepareFlowState = {
      ...flow,
      stage: "documents",
      activeDocumentCategory: null,
    };
    setFlow(nextFlow);
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: "I'm ready to start uploading due diligence documents.",
      timestamp: new Date(),
    };
    setIsTyping(true);
    setMessages(prev => {
      const next = [...prev, userMsg];
      void fetchAssistant(next, nextFlow);
      return next;
    });
  };

  const selectDocumentCategory = (cat: DocumentLabel) => {
    if (isTyping) return;
    if (!token) {
      toast({
        title: "Sign in to continue",
        description: "Create an account or sign in to use category guidance.",
        variant: "destructive",
      });
      return;
    }
    const nextFlow: PrepareFlowState = {
      ...flow,
      stage: "documents",
      activeDocumentCategory: cat,
    };
    setFlow(nextFlow);
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: `I'm focusing on uploads for **${labelToCamelCase(cat)}**.`,
      timestamp: new Date(),
    };
    setIsTyping(true);
    setMessages(prev => {
      const next = [...prev, userMsg];
      void fetchAssistant(next, nextFlow);
      return next;
    });
  };

  const goToAnotherDocumentCategory = () => {
    if (isTyping) return;
    if (!token) return;
    const completed =
      flow.activeDocumentCategory &&
      !flow.completedDocumentCategories.includes(flow.activeDocumentCategory)
        ? [...flow.completedDocumentCategories, flow.activeDocumentCategory]
        : flow.completedDocumentCategories;
    const nextFlow: PrepareFlowState = {
      ...flow,
      stage: "documents",
      activeDocumentCategory: null,
      completedDocumentCategories: completed,
    };
    setFlow(nextFlow);
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: "I'd like to work on another document category.",
      timestamp: new Date(),
    };
    setIsTyping(true);
    setMessages(prev => {
      const next = [...prev, userMsg];
      void fetchAssistant(next, nextFlow);
      return next;
    });
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    if (trimmed.toLowerCase() === "/clear") {
      setIsTyping(false);
      setMessages(initialMessages);
      setFlow(DEFAULT_PREPARE_FLOW);
      setInput("");
      try {
        localStorage.removeItem(storageKey);
        localStorage.removeItem(flowKey);
      } catch {
        /* ignore */
      }
      return;
    }

    if (!token) {
      toast({
        title: "Sign in to chat",
        description: "Create an account or sign in to talk with the assistant.",
        variant: "destructive",
      });
      return;
    }

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    const priorFlow = flowRef.current;
    const revertedFromDocuments = priorFlow.stage === "documents";
    const nextFlow: PrepareFlowState = revertedFromDocuments
      ? {
          ...priorFlow,
          stage: "business",
          activeDocumentCategory: null,
        }
      : priorFlow;
    if (revertedFromDocuments) {
      setFlow(nextFlow);
    }

    setInput("");
    setIsTyping(true);
    setMessages(prev => {
      const base = revertedFromDocuments
        ? prev.map(m => (m.categoryPicker ? { ...m, categoryPicker: false } : m))
        : prev;
      const next = [...base, userMsg];
      void fetchAssistant(next, nextFlow);
      return next;
    });
  };

  const categoryCaption = (upload: PrepareChatMessageUpload): string => {
    if (upload.error) return "";
    if (upload.uploading) return "Uploading file…";
    if (upload.documentCategory) {
      return `**Document category:** ${labelToCamelCase(upload.documentCategory)}`;
    }
    if (upload.pollExceeded) {
      return "Category will appear in your document repository when processing finishes.";
    }
    return "Identifying document category…";
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-6 pb-2 space-y-6">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={cn("flex gap-3 max-w-2xl", msg.role === "user" && "ml-auto flex-row-reverse")}
          >
            <div
              className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                msg.role === "assistant" ? "gradient-navy" : "gradient-gold",
              )}
            >
              {msg.role === "assistant" ? (
                <Bot className="h-4 w-4 text-primary-foreground" />
              ) : (
                <User className="h-4 w-4 text-accent-foreground" />
              )}
            </div>
            <div
              className={cn(
                "min-w-0 max-w-[min(100%,36rem)] px-4 py-3 rounded-xl text-sm leading-relaxed",
                msg.role === "assistant"
                  ? "bg-card border border-border text-foreground shadow-soft"
                  : "gradient-navy text-primary-foreground",
              )}
            >
              {msg.upload && (
                <div
                  className={cn(
                    "mb-3 flex max-w-full items-center gap-2 rounded-full border border-primary-foreground/25 bg-primary-foreground/10 py-1.5 pl-1.5 pr-3",
                    msg.upload.error && "border-destructive/50 bg-destructive/10",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                      getCategoryIconClass(msg.upload.fileTypeLabel),
                    )}
                  >
                    {msg.upload.uploading ||
                    (!msg.upload.error &&
                      !msg.upload.documentCategory &&
                      !msg.upload.pollExceeded) ? (
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                    ) : (
                      <FileText className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 py-0.5">
                    <p className="truncate font-medium" title={msg.upload.filename}>
                      {msg.upload.filename}
                    </p>
                    <p className="text-xs text-primary-foreground/75">{msg.upload.fileTypeLabel}</p>
                  </div>
                </div>
              )}
              {msg.upload && categoryCaption(msg.upload) && (
                <div className="text-sm text-primary-foreground/95">
                  {msg.upload.documentCategory ? (
                    renderMarkdownishLine(categoryCaption(msg.upload), `${msg.id}-cat`, false)
                  ) : (
                    <p className="text-primary-foreground/90">{categoryCaption(msg.upload)}</p>
                  )}
                </div>
              )}
              {msg.upload?.error && (
                <p className="mt-2 text-sm text-destructive">{msg.upload.error}</p>
              )}
              {msg.content.trim().length > 0 &&
                msg.content
                  .split("\n")
                  .map((line, i) =>
                    renderMarkdownishLine(line, `${msg.id}-l${i}`, i > 0 || !!msg.upload),
                  )}
              {msg.role === "assistant" &&
                msg.categoryPicker &&
                flow.stage === "documents" &&
                !flow.activeDocumentCategory && (
                  <div className="mt-3 border-t border-border pt-3">
                    <p className="mb-2 text-xs font-semibold text-muted-foreground">
                      Document Categories
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {DOCUMENT_LABELS.map(cat => (
                        <Button
                          key={cat}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-auto min-h-9 max-w-full whitespace-normal border-border bg-background/50 py-1.5 text-left text-xs text-foreground shadow-none hover:bg-muted/80 sm:text-sm"
                          disabled={isTyping}
                          onClick={() => selectDocumentCategory(cat)}
                        >
                          {labelToCamelCase(cat)}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-3 max-w-2xl">
            <div className="h-8 w-8 rounded-lg gradient-navy flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="px-4 py-3 rounded-xl bg-card border border-border shadow-soft">
              <div className="flex gap-1">
                <span
                  className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {flow.stage === "business" && hasUserTextMessage && (
        <div className="mx-auto w-full max-w-2xl shrink-0 px-6 pb-1 text-left">
          <Button
            type="button"
            variant="outline"
            className="h-8 gap-2 rounded-full border border-border/80 bg-background px-3.5 text-xs font-normal leading-none text-foreground shadow-none transition-colors hover:bg-muted/40 disabled:opacity-50 [&_svg]:size-[15px] [&_svg]:stroke-[1.35]"
            disabled={isTyping}
            onClick={startDocumentPhase}
          >
            <FolderOpen className="shrink-0 opacity-90" aria-hidden />
            Start uploading documents
          </Button>
        </div>
      )}

      {flow.stage === "documents" && flow.activeDocumentCategory && (
        <div className="mx-auto w-full max-w-2xl shrink-0 px-6 pb-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 border-border text-foreground"
            disabled={isTyping}
            onClick={goToAnotherDocumentCategory}
          >
            Choose another category
          </Button>
        </div>
      )}

      <div className="mx-auto w-full max-w-2xl shrink-0 px-6 pb-2 pt-1">
        <div className="rounded-2xl border border-border bg-card p-2 shadow-soft transition-colors focus-within:border-accent/60 focus-within:ring-2 focus-within:ring-ring/15">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="sr-only"
            tabIndex={-1}
            onChange={handleAttachmentInputChange}
          />
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={1}
            placeholder="Type your answer or ask a question..."
            className="w-full min-h-10 max-h-[200px] resize-none overflow-y-hidden bg-transparent px-3 py-2 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:outline-none"
          />
          <div className="flex items-center justify-between gap-2 px-1 pb-0.5 pt-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem
                  className="gap-2"
                  onSelect={e => {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }}
                >
                  <Upload className="h-4 w-4" />
                  Upload files
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2">
                  <Camera className="h-4 w-4" />
                  Take photo
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex items-center gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Mic className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                className="h-9 w-9 shrink-0 rounded-lg gradient-gold text-accent-foreground shadow-gold hover:opacity-90"
                onClick={handleSend}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
