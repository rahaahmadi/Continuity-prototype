import { X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface DocumentSummarySidebarProps {
  isOpen: boolean;
  documentName: string | null;
  summary: string | null;
  status: "idle" | "loading" | "ready" | "pending";
  onClose: () => void;
  className?: string;
}

/** Animated circle of dots for processing state */
function ProcessingDots() {
  const dotCount = 8;
  const radius = 20;
  return (
    <div className="relative w-14 h-14 flex items-center justify-center" aria-hidden>
      {Array.from({ length: dotCount }).map((_, i) => {
        const angle = (i / dotCount) * 2 * Math.PI - Math.PI / 2;
        const x = 50 + radius * Math.cos(angle);
        const y = 50 + radius * Math.sin(angle);
        return (
          <span
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-accent animate-processing-dot"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              transform: "translate(-50%, -50%)",
              animationDelay: `${(i / dotCount) * 0.6}s`,
            }}
          />
        );
      })}
    </div>
  );
}

export default function DocumentSummarySidebar({
  isOpen,
  documentName,
  summary,
  status,
  onClose,
  className,
}: DocumentSummarySidebarProps) {
  if (!isOpen) return null;

  const isProcessing = status === "loading" || status === "pending";
  const normalizedSummary = summary ? summary.replace(/\\n/g, "\n").trim() : "";

  return (
    <div
      className={cn(
        "w-[380px] shrink-0 border-l border-border bg-card flex flex-col overflow-hidden",
        className,
      )}
    >
      {/* Header: SUMMARY + close button */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border shrink-0">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          SUMMARY
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={onClose}
          aria-label="Close summary"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      {/* Document name */}
      <div className="px-4 py-3 border-b border-border shrink-0">
        <h3 className="font-semibold text-foreground text-sm truncate">
          {documentName ?? "Document"}
        </h3>
      </div>
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 prose prose-sm dark:prose-invert max-w-none">
          {isProcessing && (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <ProcessingDots />
              <p className="text-sm font-medium text-foreground mt-5">Processing</p>
              <p className="text-xs text-muted-foreground mt-1.5 max-w-[220px]">
                Generating your summary. This usually takes a few seconds.
              </p>
            </div>
          )}
          {!isProcessing && status === "ready" && normalizedSummary && (
            <article className="chatgpt-markdown">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ node, ...props }) => (
                    <h1 className="text-xl font-semibold mt-4 mb-2 text-foreground" {...props} />
                  ),
                  h2: ({ node, ...props }) => (
                    <h2 className="text-lg font-semibold mt-4 mb-2 text-foreground" {...props} />
                  ),
                  h3: ({ node, ...props }) => (
                    <h3 className="text-base font-semibold mt-3 mb-1.5 text-foreground" {...props} />
                  ),
                  p: ({ node, ...props }) => (
                    <p className="mb-3 leading-7 text-[14px] text-foreground" {...props} />
                  ),
                  ul: ({ node, ...props }) => (
                    <ul className="list-disc pl-6 mb-3 space-y-1 text-[14px]" {...props} />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol className="list-decimal pl-6 mb-3 space-y-1 text-[14px]" {...props} />
                  ),
                  li: ({ node, ...props }) => <li className="leading-7" {...props} />,
                  strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
                }}
              >
                {normalizedSummary}
              </ReactMarkdown>
            </article>
          )}
          {!isProcessing && status === "ready" && !normalizedSummary && (
            <p className="text-muted-foreground">No summary available.</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
