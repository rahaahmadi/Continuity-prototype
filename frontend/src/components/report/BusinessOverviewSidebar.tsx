import { ArrowLeft } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { BusinessOverviewResponse } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type BusinessOverviewStatus = BusinessOverviewResponse["status"] | "loading";

interface BusinessOverviewSidebarProps {
  isOpen: boolean;
  status: BusinessOverviewStatus;
  content: string | null;
  onBack: () => void;
}

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

export default function BusinessOverviewSidebar({
  isOpen,
  status,
  content,
  onBack,
}: BusinessOverviewSidebarProps) {
  if (!isOpen) return null;

  const isProcessing = status === "loading" || status === "pending" || status === "none";
  const normalizedContent = content ? content.replace(/\\n/g, "\n").trim() : "";

  return (
    <div className="flex-1 min-h-0">
      <ScrollArea className="h-full">
        <div className="px-8 py-10 flex flex-col items-center">
          {/* Top back + label row */}
          <div className="w-full max-w-4xl flex items-center justify-between mb-6">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to report overview</span>
            </button>
            <span className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground">
              BUSINESS OVERVIEW
            </span>
          </div>

          {isProcessing && (
            <div className="w-full max-w-xl flex flex-col items-center justify-center py-16 px-4 text-center">
              <ProcessingDots />
              <p className="text-sm font-medium text-foreground mt-5">Processing</p>
              <p className="text-xs text-muted-foreground mt-1.5 max-w-[260px]">
                Generating your business overview. This usually takes a few seconds after your documents
                have insights.
              </p>
            </div>
          )}

          {!isProcessing && status === "failed" && (
            <div className="w-full max-w-3xl rounded-xl border border-border bg-destructive/5 px-5 py-4">
              <p className="text-sm font-medium text-destructive">
                We were unable to generate your business overview. Please try again later.
              </p>
            </div>
          )}

          {!isProcessing && status === "ready" && content && (
            <article className="w-full max-w-3xl px-8 py-8 chatgpt-markdown">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ node, ...props }) => (
                    <h1 className="text-2xl font-semibold mt-6 mb-3 text-foreground" {...props} />
                  ),
                  h2: ({ node, ...props }) => (
                    <h2 className="text-xl font-semibold mt-5 mb-2 text-foreground" {...props} />
                  ),
                  h3: ({ node, ...props }) => (
                    <h3 className="text-lg font-semibold mt-4 mb-2 text-foreground" {...props} />
                  ),
                  p: ({ node, ...props }) => (
                    <p className="mb-3 leading-7 text-[15px] text-foreground" {...props} />
                  ),
                  ul: ({ node, ...props }) => (
                    <ul className="list-disc pl-6 mb-3 space-y-1 text-[15px]" {...props} />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol className="list-decimal pl-6 mb-3 space-y-1 text-[15px]" {...props} />
                  ),
                  li: ({ node, ...props }) => <li className="leading-7" {...props} />,
                  strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
                  code: ({ node, inline, ...props }: any) =>
                    inline ? (
                      <code
                        className="px-1.5 py-0.5 rounded bg-muted text-[13px] font-mono"
                        {...props}
                      />
                    ) : (
                      <code
                        className="block p-4 rounded-lg bg-muted font-mono text-[13px] overflow-x-auto"
                        {...props}
                      />
                    ),
                }}
              >
                {normalizedContent}
              </ReactMarkdown>
            </article>
          )}

          {!isProcessing && status === "ready" && !content && (
            <div className="w-full max-w-3xl rounded-xl border border-dashed border-border px-5 py-6 text-center">
              <p className="text-sm text-muted-foreground">
                No business overview is available yet. Upload documents and generate insights to create one.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}