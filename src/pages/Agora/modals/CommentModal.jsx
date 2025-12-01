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
import { Label } from "@/components/ui/label";
import { useState } from "react";

export default function CommentModal({ open, onClose, onSubmit }) {
  const [content, setContent] = useState("");

  const handleSend = () => {
    if (!content.trim()) return;
    onSubmit({ content });
    setContent("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Comment</DialogTitle>
          <DialogDescription>
            Share your thoughts or ask a question about this proposal.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <Label>Comment</Label>
          <Textarea
            placeholder="Enter your comment..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="mt-1 min-h-[120px]"
          />
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSend}>Post Comment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
