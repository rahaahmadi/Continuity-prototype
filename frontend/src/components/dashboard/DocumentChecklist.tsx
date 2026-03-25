import { CheckCircle2, Circle, Building2, Receipt, Scale, Users, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

interface ChecklistCategory {
  name: string;
  icon: React.ElementType;
  items: { label: string; completed: boolean }[];
}

const categories: ChecklistCategory[] = [
  {
    name: "Financial",
    icon: Receipt,
    items: [
      { label: "Profit & Loss (3 years)", completed: true },
      { label: "Balance Sheet", completed: true },
      { label: "Cash Flow Statement", completed: false },
      { label: "Tax Returns (3 years)", completed: false },
    ],
  },
  {
    name: "Legal",
    icon: Scale,
    items: [
      { label: "Articles of Incorporation", completed: false },
      { label: "Operating Agreement", completed: false },
      { label: "Contracts & Agreements", completed: false },
    ],
  },
  {
    name: "Operations",
    icon: Settings,
    items: [
      { label: "Standard Operating Procedures", completed: false },
      { label: "Employee Handbook", completed: false },
      { label: "Vendor Agreements", completed: false },
    ],
  },
  {
    name: "Team",
    icon: Users,
    items: [
      { label: "Org Chart", completed: false },
      { label: "Key Personnel Profiles", completed: false },
    ],
  },
  {
    name: "Property & Assets",
    icon: Building2,
    items: [
      { label: "Lease Agreements", completed: false },
      { label: "Asset Inventory", completed: false },
    ],
  },
];

const totalChecklistItems = categories.reduce((acc, c) => acc + c.items.length, 0);
const completedChecklistItems = categories.reduce((acc, c) => acc + c.items.filter(i => i.completed).length, 0);

export function getDocumentChecklistProgress() {
  return { completed: completedChecklistItems, total: totalChecklistItems };
}

interface DocumentChecklistProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DocumentChecklist = ({ open, onOpenChange }: DocumentChecklistProps) => {
  const pct = Math.round((completedChecklistItems / totalChecklistItems) * 100);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 border-border bg-card p-0 sm:max-w-md"
      >
        <SheetHeader className="space-y-0 border-b border-border p-5 pb-4 text-left">
          <SheetTitle className="pr-10 text-base font-semibold text-foreground">Document checklist</SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            {completedChecklistItems} of {totalChecklistItems} uploaded
          </SheetDescription>
          <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full gradient-gold rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-3">
          {categories.map(cat => (
            <div key={cat.name} className="mb-3">
              <div className="flex items-center gap-2 px-2 py-1.5">
                <cat.icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{cat.name}</span>
              </div>
              {cat.items.map(item => (
                <div
                  key={item.label}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                    item.completed ? "text-muted-foreground" : "cursor-pointer text-foreground hover:bg-muted",
                  )}
                >
                  {item.completed ? (
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-success" />
                  ) : (
                    <Circle className="h-4 w-4 flex-shrink-0 text-border" />
                  )}
                  <span className={cn(item.completed && "line-through")}>{item.label}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default DocumentChecklist;
