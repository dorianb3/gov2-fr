// src/components/modals/VoteModal.jsx
import { useEffect, useState } from "react";
import { supabase } from "../../supabase/client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

const CRITERIA = [
  { key: "priority_score", label: "Priorité du problème" },
  { key: "impact_score", label: "Impact attendu" },
  { key: "feasibility_score", label: "Faisabilité" },
  { key: "acceptability_score", label: "Acceptabilité sociale" },
  { key: "trust_score", label: "Confiance" },
];

export default function VoteModal({ open, onClose, proposalId, existingVote, onSubmitted }) {
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Pré-remplir si l’utilisateur a déjà voté
  useEffect(() => {
    if (existingVote) {
      setScores({
        priority_score: existingVote.priority_score ?? 3,
        impact_score: existingVote.impact_score ?? 3,
        feasibility_score: existingVote.feasibility_score ?? 3,
        acceptability_score: existingVote.acceptability_score ?? 3,
        trust_score: existingVote.trust_score ?? 3,
      });
    } else {
      setScores({
        priority_score: 3,
        impact_score: 3,
        feasibility_score: 3,
        acceptability_score: 3,
        trust_score: 3,
      });
    }
  }, [existingVote]);

  const updateScore = (key, value) => {
    setScores((prev) => ({ ...prev, [key]: value }));
  };

  async function submitVote() {
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Vous devez être connecté pour voter.");
      setLoading(false);
      return;
    }

    const payload = {
      proposal_id: proposalId,
      voter_id: user.id,
      ...scores,
    };

    const { error: voteError } = await supabase.from("votes").upsert(payload, {
      onConflict: "proposal_id,voter_id",
    });

    if (voteError) {
      setError("Impossible d’enregistrer votre vote.");
      setLoading(false);
      return;
    }

    onSubmitted?.();
    setLoading(false);
    onClose();
  }

  async function deleteVote() {
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Vous devez être connecté.");
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("votes")
      .delete()
      .eq("proposal_id", proposalId)
      .eq("voter_id", user.id);

    if (error) {
      setError("Erreur lors de la suppression du vote.");
      setLoading(false);
      return;
    }

    onSubmitted?.();
    setLoading(false);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-neutral-900 border-neutral-700 text-neutral-100">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {existingVote ? "Modifier ton vote" : "Voter sur cette proposition"}
          </DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {CRITERIA.map((c) => (
            <div key={c.key} className="space-y-1">
              <Label>{c.label}</Label>
              <Slider
                value={[scores[c.key]]}
                max={5}
                step={1}
                onValueChange={(val) => updateScore(c.key, val[0])}
              />
              <span className="text-xs text-neutral-400">{scores[c.key]}</span>
            </div>
          ))}

          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>

        <DialogFooter className="mt-6 flex justify-between items-center">
          {existingVote && (
            <Button
              variant="ghost"
              onClick={deleteVote}
              disabled={loading}
            >
              Retirer mon vote
            </Button>
          )}

          <Button onClick={submitVote} disabled={loading} className="bg-primary text-black">
            {existingVote ? "Mettre à jour" : "Envoyer mon vote"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
