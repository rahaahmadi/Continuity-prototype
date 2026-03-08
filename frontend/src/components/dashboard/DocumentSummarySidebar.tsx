import { X } from "lucide-react";
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
          {!isProcessing && status === "ready" && summary && (
            <div className="whitespace-pre-wrap text-foreground">{summary}</div>
          )}
          {!isProcessing && status === "ready" && !summary && (
            <p className="text-muted-foreground">No summary available.</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
