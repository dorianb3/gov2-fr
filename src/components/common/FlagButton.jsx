// src/components/common/FlagButton.jsx
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Flag } from "lucide-react";

import {
  getFlagsSummary,
  hasUserFlagged,
  submitFlag,
} from "../../services/flagsService";

const REASONS = [
  { value: "hate", label: "Discours haineux / discriminatoire" },
  { value: "spam", label: "Spam ou flood" },
  { value: "misinfo", label: "Désinformation" },
  { value: "offtopic", label: "Hors-sujet" },
  { value: "inappropriate", label: "Contenu inapproprié" },
];

export default function FlagButton({
  targetType,            // "issue" | "proposal" | "comment" | "review"
  targetId,              // uuid
  initialCount = null,   // facultatif pour éviter une requête
  onFlagSubmitted = null,
  size = "sm",
  variant = "destructive",
}) {
  const [open, setOpen] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);
  const [alreadyFlagged, setAlreadyFlagged] = useState(false);
  const [count, setCount] = useState(initialCount ?? 0);

  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // --------------------------------------------------
  // Charger l'utilisateur + état du flag + compteur
  // --------------------------------------------------
  useEffect(() => {
    async function load() {
      // 1. L'utilisateur a-t-il déjà flaggé ?
      const { user, alreadyFlagged } = await hasUserFlagged(
        targetType,
        targetId
      );
      setCurrentUser(user);
      setAlreadyFlagged(alreadyFlagged);

      // 2. Charger le nombre total de flags
      if (initialCount === null) {
        const { count } = await getFlagsSummary(targetType, targetId);
        setCount(count);
      }
    }

    load();
  }, [targetType, targetId]);

  // --------------------------------------------------
  // Soumission du signalement
  // --------------------------------------------------
  async function handleSubmit() {
    setErrorMsg("");

    if (!currentUser) {
      setErrorMsg("Vous devez être connecté pour signaler.");
      return;
    }

    if (!reason) {
      setErrorMsg("Merci de sélectionner un motif.");
      return;
    }

    setLoading(true);

    const result = await submitFlag({
      targetType,
      targetId,
      reason,
      details,
    });

    setLoading(false);

    if (!result.ok) {
      switch (result.error) {
        case "AUTH_REQUIRED":
          setErrorMsg("Vous devez être connecté.");
          break;
        case "ALREADY_FLAGGED":
          setAlreadyFlagged(true);
          setErrorMsg("Vous avez déjà signalé cet élément.");
          break;
        case "RATE_LIMIT":
          setErrorMsg("Trop de signalements récents. Réessayez plus tard.");
          break;
        default:
          setErrorMsg("Erreur lors du signalement. Merci de réessayer.");
      }
      return;
    }

    // Succès
    setAlreadyFlagged(true);
    setCount((c) => c + 1);
    setOpen(false);

    if (onFlagSubmitted) onFlagSubmitted();
  }

  // --------------------------------------------------
  // UI du composant
  // --------------------------------------------------
  return (
    <div className="flex items-center gap-2">
      {/* Affichage du nombre de signalements */}
      {count > 0 && (
        <span className="text-xs text-red-500 font-medium">
          {count} signalement{count > 1 ? "s" : ""}
        </span>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size={size} variant={variant}>
            <Flag className="w-4 h-4 mr-1" />
            {alreadyFlagged ? "Signalé" : "Signaler"}
          </Button>
        </DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Signaler un contenu problématique</DialogTitle>
          </DialogHeader>

          {alreadyFlagged && (
            <p className="text-sm text-red-600 mb-3">
              ⚠️ Vous avez déjà signalé cet élément.
            </p>
          )}

          <div className="flex flex-col gap-4">
            {/* Sélection de la raison */}
            <div>
              <label className="block mb-1 text-sm font-medium">Motif</label>
              <select
                className="w-full border px-3 py-2 rounded bg-card"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                <option value="">Choisir…</option>
                {REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Détails complémentaires */}
            <div>
              <label className="block mb-1 text-sm font-medium">
                Détails (optionnel)
              </label>
              <textarea
                className="w-full border px-3 py-2 rounded bg-card" 
                rows={3}
                placeholder="Informations complémentaires…"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
              />
            </div>

            {/* Message d'erreur */}
            {errorMsg && (
              <p className="text-sm text-red-600 font-medium">{errorMsg}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              onClick={handleSubmit}
              disabled={loading || alreadyFlagged}
              variant="destructive"
            >
              {loading ? "Envoi…" : "Envoyer le signalement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
