import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Settings as SettingsIcon, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";

type SettingsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Derive a display name from email until we have first/last name in the DB. */
function displayNameFromEmail(email: string): string {
  const local = email.split("@")[0];
  if (!local) return "—";
  return local.replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const SettingsModal = ({ open, onOpenChange }: SettingsModalProps) => {
  const navigate = useNavigate();
  const { user, deleteAccount } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      onOpenChange(false);
      navigate("/", { replace: true });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl w-[calc(100%-2rem)] p-0 gap-0 overflow-hidden rounded-xl border border-border bg-card shadow-xl font-sans [&>button]:left-4 [&>button]:right-auto [&>button]:top-4">
          <div className="flex flex-col h-[min(80vh,32rem)]">
            <header className="flex items-center gap-3 shrink-0 px-4 py-3 pl-14 border-b border-border">
              <DialogTitle className="sr-only">Settings</DialogTitle>
              <h2 className="text-lg font-semibold text-foreground">Settings</h2>
            </header>

            <Tabs defaultValue="general" className="flex flex-1 flex-row min-h-0 font-sans">
              <TabsList className="flex flex-col items-stretch justify-start w-48 shrink-0 rounded-none border-r border-border bg-muted/30 p-2 gap-0.5 self-start h-full">
                <TabsTrigger
                  value="general"
                  className="justify-start gap-3 rounded-lg px-3 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm font-normal text-sm"
                >
                  <SettingsIcon className="h-4 w-4 shrink-0" />
                  General
                </TabsTrigger>
                <TabsTrigger
                  value="account"
                  className="justify-start gap-3 rounded-lg px-3 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm font-normal text-sm"
                >
                  <User className="h-4 w-4 shrink-0" />
                  Account
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto min-h-0 min-w-0">
                <TabsContent value="general" className="m-0 p-6 focus-visible:outline-none focus-visible:ring-0">
                  <h3 className="text-base font-medium text-foreground font-sans mb-1">General</h3>
                  <p className="text-sm text-muted-foreground font-sans">
                    General application preferences will appear here.
                  </p>
                </TabsContent>
                <TabsContent value="account" className="m-0 p-6 focus-visible:outline-none focus-visible:ring-0">
                  <h3 className="text-base font-medium text-foreground font-sans mb-6">Account</h3>

                  <div className="space-y-6 font-sans">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-muted-foreground">Name</span>
                        <span className="text-sm font-medium text-foreground">
                          {user ? displayNameFromEmail(user.email) : "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-muted-foreground">Email</span>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium text-foreground">
                            {user?.email ?? "—"}
                          </span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-border pt-6 mt-6">
                      <div className="flex items-center justify-between gap-4 py-4">
                        <div>
                          <p className="text-sm font-medium text-foreground">Delete account</p>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            Permanently delete your account and all associated data. This cannot be undone.
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          className="shrink-0 font-sans"
                          onClick={() => setDeleteDialogOpen(true)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="font-sans">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your account and all your documents and data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteAccount();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-sans"
            >
              {deleting ? "Deleting…" : "Delete account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SettingsModal;
