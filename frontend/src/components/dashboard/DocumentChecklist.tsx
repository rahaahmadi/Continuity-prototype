import { CheckCircle2, Circle, FileText, Building2, Receipt, Scale, Users, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

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

const DocumentChecklist = () => {
  const total = categories.reduce((acc, c) => acc + c.items.length, 0);
  const completed = categories.reduce((acc, c) => acc + c.items.filter(i => i.completed).length, 0);
  const pct = Math.round((completed / total) * 100);

  return (
    <div className="w-80 border-r border-border bg-card h-full overflow-y-auto">
      <div className="p-5 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
            <FileText className="h-4 w-4 text-accent" />
            Document Checklist
          </h3>
          <span className="text-xs font-medium text-muted-foreground">{pct}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full gradient-gold rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-muted-foreground mt-2">{completed} of {total} documents uploaded</p>
      </div>

      <div className="p-3 space-y-1">
        {categories.map(cat => (
          <div key={cat.name} className="mb-3">
            <div className="flex items-center gap-2 px-2 py-1.5">
              <cat.icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{cat.name}</span>
            </div>
            {cat.items.map(item => (
              <div key={item.label} className={cn(
                "flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm cursor-pointer transition-colors",
                item.completed ? "text-muted-foreground" : "text-foreground hover:bg-muted"
              )}>
                {item.completed ? (
                  <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-border flex-shrink-0" />
                )}
                <span className={cn(item.completed && "line-through")}>{item.label}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentChecklist;
