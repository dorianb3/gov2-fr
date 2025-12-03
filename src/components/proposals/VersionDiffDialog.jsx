// src/components/proposals/VersionDiffDialog.jsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Diff très simple ligne par ligne
function computeLineDiff(oldText, newText) {
  const oldLines = (oldText || "").split("\n");
  const newLines = (newText || "").split("\n");
  const result = [];

  let i = 0;
  let j = 0;

  while (i < oldLines.length || j < newLines.length) {
    const oldLine = oldLines[i];
    const newLine = newLines[j];

    if (oldLine === newLine) {
      result.push({ type: "unchanged", text: newLine });
      i++;
      j++;
    } else if (
      newLine !== undefined &&
      !oldLines.slice(i + 1).includes(newLine)
    ) {
      // Ligne ajoutée
      result.push({ type: "added", text: newLine });
      j++;
    } else if (
      oldLine !== undefined &&
      !newLines.slice(j + 1).includes(oldLine)
    ) {
      // Ligne supprimée
      result.push({ type: "removed", text: oldLine });
      i++;
    } else {
      // Diff complexe : on marque suppression + ajout
      if (oldLine !== undefined) {
        result.push({ type: "removed", text: oldLine });
        i++;
      }
      if (newLine !== undefined) {
        result.push({ type: "added", text: newLine });
        j++;
      }
    }
  }

  return result;
}

export default function VersionDiffDialog({
  open,
  onOpenChange,
  version,
  currentSnapshot,
}) {
  const oldText = version.snapshot?.content || version.content || "";
  const newText = currentSnapshot?.content || "";
  const diff = computeLineDiff(oldText, newText);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[70vh] flex flex-col">
        <DialogHeader className="pb-2">
          <DialogTitle>
            Version {version.version_number} — comparaison avec la version
            actuelle
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto mt-2 border border-neutral-800 rounded bg-neutral-950/80">
          <pre className="text-xs p-3 font-mono whitespace-pre-wrap">
            {diff.map((line, idx) => {
              if (line.type === "unchanged") {
                return (
                  <span key={idx} className="block text-neutral-300">
                    {"  "} {line.text}
                  </span>
                );
              }
              if (line.type === "added") {
                return (
                  <span key={idx} className="block text-emerald-400">
                    + {line.text}
                  </span>
                );
              }
              if (line.type === "removed") {
                return (
                  <span key={idx} className="block text-red-400">
                    - {line.text}
                  </span>
                );
              }
              return null;
            })}
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  );
}
