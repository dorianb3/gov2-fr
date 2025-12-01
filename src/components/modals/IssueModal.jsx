// src/components/modals/IssueModal.jsx
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function IssueModal({ open, onClose, topicId, onSubmitted }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) return;

    setIsSubmitting(true);

    const user = (await supabase.auth.getUser()).data.user;

    const { error } = await supabase.from("issues").insert({
      topic_id: topicId,
      title,
      description,
      created_by: user.id,
    });

    setIsSubmitting(false);

    if (!error) {
      onSubmitted?.();
      onClose();
      setTitle("");
      setDescription("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card text-foreground">
        <DialogHeader>
          <DialogTitle>Create a new Issue</DialogTitle>
          <DialogDescription>
            Provide a title and a short description to describe the issue clearly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input
              className="mt-1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Public Transport Efficiency"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              className="mt-1"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue…"
            />
          </div>

          <Button onClick={handleCreate} disabled={isSubmitting}>
            {isSubmitting ? "Creating…" : "Create Issue"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
