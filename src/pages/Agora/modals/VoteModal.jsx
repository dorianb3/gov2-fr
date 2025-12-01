import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectItem, SelectContent, SelectValue } from "@/components/ui/select";
import { useState } from "react";

const SCORE_OPTIONS = ["0", "1", "2", "3", "4", "5"];

export default function VoteModal({ open, onClose, onSubmit }) {
  const [scores, setScores] = useState({
    priority: "3",
    impact: "3",
    feasibility: "3",
    acceptability: "3",
    trust: "3",
  });

  const update = (field, val) =>
    setScores((prev) => ({ ...prev, [field]: val }));

  const handleSend = () => {
    onSubmit({
      priority_score: Number(scores.priority),
      impact_score: Number(scores.impact),
      feasibility_score: Number(scores.feasibility),
      acceptability_score: Number(scores.acceptability),
      trust_score: Number(scores.trust),
    });

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Vote</DialogTitle>
          <DialogDescription>
            Evaluate this proposal on each criterion (0 to 5).
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {Object.entries(scores).map(([key, val]) => (
            <div key={key} className="flex flex-col gap-1">
              <Label>{key.replace("_", " ").toUpperCase()}</Label>
              <Select value={val} onValueChange={(v) => update(key, v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select score" />
                </SelectTrigger>
                <SelectContent>
                  {SCORE_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSend}>Submit Vote</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
