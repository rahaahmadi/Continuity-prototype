import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import QAChat from "@/components/report/QAChat";

const QA = () => {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-border bg-card px-8 py-6">
          <h1 className="text-2xl font-serif font-bold text-foreground">Business Q&amp;A</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ask questions grounded in the documents and generated report.
          </p>
        </div>

        <div className="flex-1 min-h-0 p-8">
          <QAChat isOpen onClose={() => {}} variant="embedded" />
        </div>
      </div>
    </div>
  );
};

export default QA;
