import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import VersionDiffDialog from "@/components/proposals/VersionDiffDialog";
import { useState } from "react";
import { Eye, FileDiff  } from "lucide-react";

export default function ProposalVersionsPanel({
  versions,
  currentContentSnapshot,
  formatDateTime,
  onRestoreVersion,
}) {
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogInitialTab, setDialogInitialTab] = useState("view"); // "view" | "diff"

  const handleOpenView = (version) => {
    setSelectedVersion(version);
    setDialogInitialTab("view");
    setDialogOpen(true);
  };

  const handleOpenDiff = (version) => {
    setSelectedVersion(version);
    setDialogInitialTab("diff");
    setDialogOpen(true);
  };

  return (
    <>
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Versions</CardTitle>
          <CardDescription>
            Historique des modifications de contenu.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[320px] overflow-y-auto">
          {versions.length === 0 && (
            <p className="text-sm text-neutral-400">
              Aucune version enregistrée (en dehors de la version actuelle).
            </p>
          )}
          {versions.map((v) => (
            <div
              key={v.id}
              className="bg-neutral-950 border border-neutral-800 p-3 rounded-md  flex justify-between items-center"
            >
              <div className=" text-xs text-neutral-400">
                <span>Version {v.version_number} - </span>
                <span>{formatDateTime(v.created_at)}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="px-1.5 py-1 bg-card rounded"
                  onClick={() => handleOpenView(v)}
                >
                  <Eye size={16}/>
                </button>
                <button
                  className="px-1.5 py-1 bg-card rounded"
                  onClick={() => handleOpenDiff(v)}
                >
                  <FileDiff size={16}/>
                </button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {selectedVersion && (
        <VersionDiffDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          version={selectedVersion}
          currentSnapshot={currentContentSnapshot}
          initialTab={dialogInitialTab}
          onRestoreVersion={onRestoreVersion} 
          isLatest={selectedVersion?.version_number === versions[0]?.version_number}
        />
      )}
    </>
  );
}
