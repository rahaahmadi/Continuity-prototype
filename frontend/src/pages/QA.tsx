import { useState } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import SettingsModal from "@/components/dashboard/SettingsModal";
import QAChat from "@/components/report/QAChat";

const QA = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <DashboardSidebar onOpenSettings={() => setSettingsOpen(true)} />
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      <div className="flex flex-1 flex-col overflow-hidden min-h-0">
        <div className="shrink-0 border-b border-border bg-card px-8 py-6">
          <h1 className="text-2xl font-sans font-bold text-foreground">Business Q&amp;A</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ask questions grounded in the documents and generated report.
          </p>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-8 max-w-5xl">
          <QAChat isOpen onClose={() => {}} variant="embedded" />
        </div>
      </div>
    </div>
  );
};

export default QA;
