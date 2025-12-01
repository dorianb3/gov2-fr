import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function ProposalModal({ open, onClose, onSubmit }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [impact, setImpact] = useState("");
  const [cost, setCost] = useState("");

  const handleSend = () => {
    if (!title.trim() || !content.trim()) return;

    onSubmit({
      title,
      content,
      impact_expected: impact,
      estimated_cost: cost,
    });

    setTitle("");
    setContent("");
    setImpact("");
    setCost("");

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>New Proposal</DialogTitle>
          <DialogDescription>
            Suggest a structured solution to the selected issue.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div>
            <Label>Title</Label>
            <Input
              placeholder="Ex: National mobility reform plan..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Content</Label>
            <Textarea
              placeholder="Explain the full plan, steps, mechanisms..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mt-1 min-h-[140px]"
            />
          </div>

          <div>
            <Label>Expected Impact</Label>
            <Textarea
              placeholder="What positive outcomes are expected?"
              value={impact}
              onChange={(e) => setImpact(e.target.value)}
              className="mt-1 min-h-[80px]"
            />
          </div>

          <div>
            <Label>Estimated Cost</Label>
            <Textarea
              placeholder="Optional: financial estimation"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className="mt-1 min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSend}>Submit Proposal</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
