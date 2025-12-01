// src/components/modals/VoteModal.jsx
import { useState } from "react";
import { supabase } from "../../supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

const CRITERIA = [
  { key: "priority_score", label: "Priority" },
  { key: "impact_score", label: "Impact" },
  { key: "feasibility_score", label: "Feasibility" },
  { key: "acceptability_score", label: "Acceptability" },
  { key: "trust_score", label: "Trust" },
];

export default function VoteModal({ open, onClose, proposalId, onSubmitted }) {
  const [scores, setScores] = useState({
    priority_score: 3,
    impact_score: 3,
    feasibility_score: 3,
    acceptability_score: 3,
    trust_score: 3,
  });

  const updateScore = (key, value) => {
    setScores((s) => ({ ...s, [key]: value }));
  };

  const handleSend = async () => {
    const user = (await supabase.auth.getUser()).data.user;

    await supabase.from("votes").insert({
      proposal_id: proposalId,
      voter_id: user.id,
      ...scores,
    });

    onSubmitted?.();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card text-foreground">
        <DialogHeader>
          <DialogTitle>Vote on Proposal</DialogTitle>
          <DialogDescription>
            Provide .
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {CRITERIA.map((c) => (
            <div key={c.key}>
              <Label>{c.label}</Label>
              <Slider
                defaultValue={[scores[c.key]]}
                max={5}
                step={1}
                onValueChange={(val) => updateScore(c.key, val[0])}
                className="mt-2"
              />
              <span className="text-sm opacity-70">{scores[c.key]}</span>
            </div>
          ))}

          <Button onClick={handleSend}>Submit Vote</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
