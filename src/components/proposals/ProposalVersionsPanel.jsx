// src/components/proposals/ProposalVersionsPanel.jsx
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

export default function ProposalVersionsPanel({
  versions,
  currentContentSnapshot,
  formatDateTime,
}) {
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [diffOpen, setDiffOpen] = useState(false);

  const handleOpenDiff = (version) => {
    setSelectedVersion(version);
    setDiffOpen(true);
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
              className="bg-neutral-950 border border-neutral-800 p-3 rounded-md space-y-2"
            >
              <div className="flex justify-between items-center text-xs text-neutral-400">
                <span>Version {v.version_number}</span>
                <span>{formatDateTime(v.created_at)}</span>
              </div>
              <p className="text-xs text-neutral-200 whitespace-pre-line line-clamp-4">
                {v.content}
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => setSelectedVersion(v)}
                >
                  Voir la version
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => handleOpenDiff(v)}
                >
                  Voir les différences
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {selectedVersion && (
        <VersionDiffDialog
          open={diffOpen}
          onOpenChange={setDiffOpen}
          version={selectedVersion}
          currentSnapshot={currentContentSnapshot}
        />
      )}
    </>
  );
}
