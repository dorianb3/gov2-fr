// src/components/modals/ReviewModal.jsx
import { useState } from "react";
import { supabase } from "../../supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";

const CATEGORIES = [
  "clarity",
  "feasibility",
  "cost",
  "impact",
  "risks",
  "legal",
];

export default function ReviewModal({ open, onClose, proposalId, onSubmitted }) {
  const [category, setCategory] = useState("clarity");
  const [score, setScore] = useState(3);
  const [comment, setComment] = useState("");

  const handleSend = async () => {
    const user = (await supabase.auth.getUser()).data.user;

    await supabase.from("reviews").insert({
      proposal_id: proposalId,
      reviewer_id: user.id,
      category,
      score,
      comment,
    });

    onSubmitted?.();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card text-foreground">
        <DialogHeader>
          <DialogTitle>Ecrire une revue de la proposition</DialogTitle>
          <DialogDescription>
            Provide a title and a short description to describe the issue clearly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Label>Category</Label>
          <Select value={category} onValueChange={(v) => setCategory(v)}>
            <SelectTrigger className="bg-background" />
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div>
            <Label>Score (0–5)</Label>
            <Input
              type="number"
              min={0}
              max={5}
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              className="w-20 mt-1"
            />
          </div>

          <div>
            <Label>Comment</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mt-1"
            />
          </div>

          <Button onClick={handleSend}>Submit Review</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
