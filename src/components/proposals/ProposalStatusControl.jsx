// src/components/proposals/ProposalStatusControl.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../../supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Pencil } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "draft", label: "Brouillon" },
  { value: "submitted", label: "Soumis" },
  { value: "reviewed", label: "En revue" },
  { value: "validated", label: "Validé" },
  { value: "rejected", label: "Rejeté" },
];

function statusLabel(value) {
  const found = STATUS_OPTIONS.find((s) => s.value === value);
  return found ? found.label : value || "Inconnu";
}

function statusBadgeClass(value) {
  // Palette rapide : tu peux ajuster à ton goût
  switch (value) {
    case "validated":
      return "bg-emerald-500 text-black";
    case "rejected":
      return "bg-red-500 text-black";
    case "reviewed":
      return "bg-blue-500 text-black";
    case "submitted":
      return "bg-amber-400 text-black";
    case "draft":
    default:
      return "bg-neutral-500 text-black";
  }
}

/**
 * Composant qui fusionne :
 * - affichage du statut (toujours visible)
 * - si role ∈ {moderator, elected} : bouton pour ouvrir un modal de changement
 */
export default function ProposalStatusControl({
  proposalId,
  status,
  userRole,         // "citizen" | "expert" | "moderator" | "elected" | null
  onStatusChanged,  // callback optionnel, ex: () => loadAll()
}) {
  const isInstitutional =
    userRole === "moderator" || userRole === "elected";

  const [open, setOpen] = useState(false);
  const [localStatus, setLocalStatus] = useState(status || "");
  const [comment, setComment] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Sync quand le statut de la prop change (rechargement depuis la DB)
  useEffect(() => {
    setLocalStatus(status || "");
  }, [status]);

  async function handleSave() {
    setErrorMsg("");

    if (!localStatus) {
      setErrorMsg("Merci de sélectionner un statut.");
      return;
    }

    // Optionnel : éviter d’appeler la RPC si pas de changement réel
    if (localStatus === status && !comment.trim()) {
      setErrorMsg("Aucun changement détecté.");
      return;
    }

    try {
      setLoading(true);

      // Vérif côté front (la RPC revalidera le rôle de toute façon)
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setErrorMsg("Tu dois être connecté.");
        setLoading(false);
        return;
      }

      const { error } = await supabase.rpc("change_proposal_status", {
        _proposal_id: proposalId,
        _new_status: localStatus,
        _comment: comment.trim() || null,
      });

      if (error) {
        console.error("change_proposal_status error:", error);
        setErrorMsg(
          "Impossible de changer le statut (droits insuffisants ou erreur serveur)."
        );
        setLoading(false);
        return;
      }

      setComment("");
      setOpen(false);

      if (onStatusChanged) {
        await onStatusChanged();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Badge visible pour tout le monde */}
      <Badge className={statusBadgeClass(status)}>
        Statut : {statusLabel(status)}
      </Badge>

      {/* Bouton "éditer" visible uniquement pour modérateurs / élus */}
      {isInstitutional && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-neutral-300 hover:text-white"
              title="Changer le statut"
            >
              <Pencil className="w-4 h-4" />
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Changer le statut de la proposition</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium">
                  Nouveau statut
                </label>
                <select
                  className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-sm"
                  value={localStatus}
                  onChange={(e) => setLocalStatus(e.target.value)}
                >
                  <option value="">— Choisir —</option>
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium">
                  Commentaire (optionnel)
                </label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Justifie ce changement pour la traçabilité et la transparence…"
                  className="min-h-[90px]"
                />
              </div>

              {errorMsg && (
                <p className="text-sm text-red-400">{errorMsg}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => setOpen(false)}
                type="button"
              >
                Annuler
              </Button>
              <Button
                className="bg-primary text-black"
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? "Mise à jour…" : "Modifier le statut"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
