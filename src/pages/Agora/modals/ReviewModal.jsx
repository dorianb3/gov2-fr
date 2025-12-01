import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectItem, SelectContent } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState } from "react";

const CATEGORIES = ["clarity", "feasibility", "cost", "impact", "risks", "legal"];
const SCORE_OPTIONS = ["0", "1", "2", "3", "4", "5"];

export default function ReviewModal({ open, onClose, onSubmit }) {
  const [category, setCategory] = useState("clarity");
  const [comment, setComment] = useState("");
  const [score, setScore] = useState("3");

  const handleSend = () => {
    if (!comment.trim()) return;

    onSubmit({
      category,
      comment,
      score: Number(score),
    });

    setComment("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Review</DialogTitle>
          <DialogDescription>
            Provide a structured expert evaluation.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Score</Label>
            <Select value={score} onValueChange={setScore}>
              <SelectTrigger>
                <SelectValue />
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

          <div>
            <Label>Comment</Label>
            <Textarea
              placeholder="Add structured feedback..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[120px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSend}>Submit Review</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
