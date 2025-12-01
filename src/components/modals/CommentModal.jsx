// src/components/modals/CommentModal.jsx
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function CommentModal({ open, onClose, proposalId, onSubmitted }) {
  const [content, setContent] = useState("");

  const handleSend = async () => {
    const user = (await supabase.auth.getUser()).data.user;

    await supabase.from("comments").insert({
      proposal_id: proposalId,
      author_id: user.id,
      content,
    });

    onSubmitted?.();
    onClose();
    setContent("");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card text-foreground">
        <DialogHeader>
          <DialogTitle>Add a Comment</DialogTitle>
          <DialogDescription>
            Provide a title and a short description to describe the issue clearly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Label>Comment</Label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your comment…"
          />

          <Button onClick={handleSend}>Send</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
