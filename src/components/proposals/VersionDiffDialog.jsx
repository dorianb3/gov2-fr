import { useEffect, useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
/**
 * Diff très simple ligne par ligne (comme convenu)
 */
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
    } else if (newLine !== undefined && !oldLines.slice(i + 1).includes(newLine)) {
      // Ligne ajoutée
      result.push({ type: "added", text: newLine });
      j++;
    } else if (oldLine !== undefined && !newLines.slice(j + 1).includes(oldLine)) {
      // Ligne supprimée
      result.push({ type: "removed", text: oldLine });
      i++;
    } else {
      // Cas plus complexe : on marque suppression + ajout
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

const FIELD_LABELS = {
  title: "Titre",
  objectives: "Objectifs",
  content: "Description globale",
  actions: "Actions concrètes",
  means: "Moyens nécessaires",
  timeline: "Timeline / Phases",
  risks: "Risques",
  territorial_scope: "Portée territoriale",
  target_populations: "Populations ciblées",
  impact_expected: "Impact attendu",
  estimated_cost: "Coût estimé",
  data_sources: "Sources de données",
};

const TEXT_DIFF_FIELDS = [
  "title",
  "objectives",
  "content",
  "impact_expected",
  "estimated_cost",
  "territorial_scope",
];

function formatArray(value) {
  if (!Array.isArray(value)) return "";
  return value.map((v) => {
    if (typeof v === "string") return `• ${v}`;
    if (v && typeof v === "object") {
      if (v.title || v.phase || v.risk || v.label) {
        return (
          "• " +
          (v.title ||
            v.phase ||
            v.risk ||
            v.label ||
            JSON.stringify(v))
        );
      }
      return "• " + JSON.stringify(v);
    }
    return "• " + String(v);
  }).join("\n");
}

function formatValueForDisplay(key, value) {
  if (!value) return "";

  // Arrays structurées
  if (Array.isArray(value)) {
    return formatArray(value);
  }

  // JSON brut
  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }

  return String(value);
}

function fieldChanged(oldVal, newVal) {
  return JSON.stringify(oldVal ?? null) !== JSON.stringify(newVal ?? null);
}

export default function VersionDiffDialog({
  open,
  onOpenChange,
  version,
  currentSnapshot,
  initialTab = "view", // "view" ou "diff"
  onRestoreVersion,
  isLatest,
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [restoring, setRestoring] = useState(false);

  if (!version) return null;



  // Synchroniser l’onglet quand on ouvre la modale depuis un bouton différent
  useEffect(() => {
    if (open) {
      setActiveTab(initialTab || "view");
    }
  }, [open, initialTab]);

  const snapshot = version?.snapshot || {};
  const current = currentSnapshot || {};

  const changedFields = useMemo(() => {
    const keys = Object.keys(FIELD_LABELS);
    return keys.filter((key) =>
      fieldChanged(snapshot[key], current[key])
    );
  }, [snapshot, current]);


  const handleRestoreClick = async () => {
    if (!onRestoreVersion) return;

    const ok = window.confirm(
      "Cette opération va remplacer le contenu actuel par cette version et créer une nouvelle entrée dans l'historique. Continuer ?"
    );
    if (!ok) return;

    try {
      setRestoring(true);
      await onRestoreVersion(version.id);
      // on ferme la modale après restauration
      onOpenChange(false);
    } finally {
      setRestoring(false);
    }
  };



  const renderTextDiff = (oldText, newText) => {
    const diff = computeLineDiff(oldText || "", newText || "");
    return (
      <pre className="text-xs p-2 font-mono whitespace-pre-wrap rounded bg-neutral-950/70 border border-neutral-800 max-h-48 overflow-y-auto">
        {diff.map((line, idx) => {
          if (line.type === "unchanged") {
            return (
              <span key={idx} className="block text-neutral-300">
                {"  "}
                {line.text}
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
    );
  };

  const renderFieldView = (key) => {
    const label = FIELD_LABELS[key] || key;
    const value = snapshot[key];

    if (
      value == null ||
      (typeof value === "string" && value.trim() === "") ||
      (Array.isArray(value) && value.length === 0)
    ) {
      return null;
    }

    return (
      <div key={key} className="space-y-1">
        <div className="text-xs font-semibold text-neutral-300">
          {label}
        </div>
        <pre className="text-xs whitespace-pre-wrap bg-neutral-950/70 border border-neutral-800 rounded p-2">
          {formatValueForDisplay(key, value)}
        </pre>
      </div>
    );
  };

  const renderFieldDiff = (key) => {
    const label = FIELD_LABELS[key] || key;
    const oldVal = snapshot[key];
    const newVal = current[key];

    if (!fieldChanged(oldVal, newVal)) return null;

    const isTextDiff = TEXT_DIFF_FIELDS.includes(key);

    return (
      <div
        key={key}
        className="space-y-2 rounded-md border border-neutral-800 p-3 bg-neutral-950/60"
      >
        <div className="text-xs font-semibold text-neutral-200">
          {label}
        </div>
        {isTextDiff ? (
          <div className="space-y-1">
            <div className="text-[11px] text-neutral-500">
              Diff ligne par ligne
            </div>
            {renderTextDiff(
              typeof oldVal === "string" ? oldVal : formatValueForDisplay(key, oldVal),
              typeof newVal === "string" ? newVal : formatValueForDisplay(key, newVal)
            )}
          </div>
        ) : (
          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <div className="text-[11px] text-neutral-500 mb-1">
                Ancienne valeur
              </div>
              <pre className="text-xs whitespace-pre-wrap bg-neutral-950/70 border border-neutral-800 rounded p-2">
                {oldVal != null
                  ? formatValueForDisplay(key, oldVal)
                  : "—"}
              </pre>
            </div>
            <div>
              <div className="text-[11px] text-neutral-500 mb-1">
                Valeur actuelle
              </div>
              <pre className="text-xs whitespace-pre-wrap bg-neutral-950/70 border border-neutral-800 rounded p-2">
                {newVal != null
                  ? formatValueForDisplay(key, newVal)
                  : "—"}
              </pre>
            </div>
          </div>
        )}
      </div>
    );
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col bg-neutral-900">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex flex-col gap-1">
            <span>
              Version {version.version_number} —{" "}
              <span className="text-sm text-neutral-400">
                {new Date(version.created_at).toLocaleString()}
              </span>
            </span>

          </DialogTitle>

            <DialogDescription className="text-xs text-neutral-500">
              Visualiser le contenu complet à cette date ou comparer champ par champ
              avec la version actuelle.
            </DialogDescription>
        </DialogHeader>

        {/* Tabs maison (view / diff) */}
        <div className="px-1 mb-3">
          <div className="inline-flex rounded-md border border-neutral-700 bg-neutral-950/60 text-xs">
            <button
              type="button"
              className={`px-3 py-1.5 rounded-l-md transition-colors ${
                activeTab === "view"
                  ? "bg-neutral-800 text-neutral-50"
                  : "text-neutral-400 hover:bg-neutral-900"
              }`}
              onClick={() => setActiveTab("view")}
            >
              Fiche complète
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 rounded-r-md border-l border-neutral-700 transition-colors ${
                activeTab === "diff"
                  ? "bg-neutral-800 text-neutral-50"
                  : "text-neutral-400 hover:bg-neutral-900"
              }`}
              onClick={() => setActiveTab("diff")}
            >
              Diff avec l’actuelle
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {activeTab === "view" && (
            <div className="space-y-3">
              {/* Meta de base */}
              <div className="text-xs text-neutral-400 border border-neutral-800 rounded-md p-2 bg-neutral-950/60">
                <div>
                  <span className="font-semibold text-neutral-200">
                    ID version :
                  </span>{" "}
                  <span className="font-mono text-[11px]">
                    {version.id}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-neutral-200">
                    ID proposition :
                  </span>{" "}
                  <span className="font-mono text-[11px]">
                    {version.proposal_id}
                  </span>
                </div>
              </div>

              {/* Champs du snapshot */}
              {Object.keys(FIELD_LABELS).map((key) => renderFieldView(key)) || (
                <p className="text-xs text-neutral-500">
                  Aucun contenu dans le snapshot pour cette version.
                </p>
              )}
            </div>
          )}

          {activeTab === "diff" && (
            <div className="space-y-3">
              {changedFields.length === 0 && !isLatest && (
                <p className="text-sm text-neutral-400">
                  Aucun champ ne semble différer de la version actuelle.
                </p>
              )}
              {changedFields.length === 0 && isLatest && (
                <p className="text-sm text-neutral-400">
                  Cette version est la version actuelle.
                </p>
              )}
              {changedFields.map((key) => renderFieldDiff(key))}
            </div>
          )}
        </div>

        {!isLatest && onRestoreVersion && (
          <Button
            size="sm"
            variant="destructive"
            onClick={handleRestoreClick}
            disabled={restoring}
            className="w-fit text-xs"
          >
            {restoring ? "Restauration…" : "Restaurer cette version"}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
