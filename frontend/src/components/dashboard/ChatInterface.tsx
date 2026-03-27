import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Plus, Mic, Bot, User, Upload, Camera, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getDocument, uploadDocument } from "@/lib/api";
import { getFileCategoryLabel, getCategoryIconClass } from "@/lib/fileCategory";
import { cn } from "@/lib/utils";

const CLASSIFICATION_POLL_MS = 2000;
const CLASSIFICATION_MAX_POLLS = 45;

type MessageUpload = {
  documentId: string | null;
  filename: string;
  fileTypeLabel: string;
  uploading: boolean;
  documentCategory: string | null;
  error?: string;
  pollExceeded?: boolean;
};

interface Message {
  id: string;
  role: "assistant" | "user";
  content: string;
  timestamp: Date;
  upload?: MessageUpload;
}

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

const ChatInterface = () => {
  const { token } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const TEXTAREA_MAX_PX = 200;

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

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "Thank you for sharing that! Understanding your industry context is crucial for potential buyers.\n\n**Next question:** Who are your key customers, and how dependent is the business on any single client relationship?",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500);
  };

  const categoryCaption = (upload: MessageUpload): string => {
    if (upload.error) return "";
    if (upload.uploading) return "Uploading file…";
    if (upload.documentCategory) {
      return `**Document category:** ${upload.documentCategory}`;
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

      <div className="mx-auto w-full max-w-2xl shrink-0 px-6 py-2">
        <div className="rounded-2xl border border-border bg-card p-2 shadow-soft transition-colors focus-within:border-accent/60 focus-within:ring-2 focus-within:ring-ring/15">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
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
                    window.setTimeout(() => fileInputRef.current?.click(), 0);
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
