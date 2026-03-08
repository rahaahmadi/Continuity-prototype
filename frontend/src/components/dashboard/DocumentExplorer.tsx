import { FileText } from "lucide-react";
import { DOCUMENT_LABELS, labelToCamelCase } from "@/constants/documentLabels";
import { cn } from "@/lib/utils";

export type ExplorerCategory = string | null; // null = "All"

interface DocumentExplorerProps {
  selectedCategory: ExplorerCategory;
  onSelectCategory: (category: ExplorerCategory) => void;
  /** Optional action (e.g. close button) shown at top-right of the panel header */
  headerAction?: React.ReactNode;
  className?: string;
}

export default function DocumentExplorer({
  selectedCategory,
  onSelectCategory,
  headerAction,
  className,
}: DocumentExplorerProps) {
  return (
    <div
      className={cn(
        "w-64 border-r border-border bg-card flex flex-col overflow-hidden shrink-0",
        className,
      )}
    >
      <div className="p-4 border-b border-border flex items-center justify-between gap-2">
        <h3 className="font-semibold text-foreground text-sm flex items-center gap-2 min-w-0">
          <FileText className="h-4 w-4 text-accent shrink-0" />
          <span className="truncate">Categories</span>
        </h3>
        {headerAction}
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        <button
          type="button"
          onClick={() => onSelectCategory(null)}
          className={cn(
            "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
            selectedCategory === null
              ? "bg-accent/15 text-accent font-medium"
              : "text-foreground hover:bg-muted",
          )}
        >
          All documents
        </button>
        {DOCUMENT_LABELS.map((label) => {
          const display = labelToCamelCase(label);
          const isSelected = selectedCategory === label;
          return (
            <button
              key={label}
              type="button"
              onClick={() => onSelectCategory(label)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                isSelected ? "bg-accent/15 text-accent font-medium" : "text-foreground hover:bg-muted",
              )}
            >
              {display}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
