// src/components/proposals/ProposalCommentsSection.jsx
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function ProposalCommentsSection({
  comments,
  onSubmitComment,
  formatDateTime,
}) {
  const [commentText, setCommentText] = useState("");

  const handleSubmit = () => {
    onSubmitComment(commentText);
    setCommentText("");
  };

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-2xl font-semibold">Commentaires</h2>
        <p className="text-sm text-neutral-400 mt-1">
          Discussion libre autour de la proposition (hors structure de
          review).
        </p>
      </div>

      {/* WRITE COMMENT */}
      <Card className="bg-neutral-900 border-neutral-700 p-4 space-y-4">
        <Textarea
          placeholder="Réagis à la proposition, pose des questions, partage des exemples concrets…"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          className="min-h-[80px]"
        />
        <Button
          className="bg-primary text-black w-fit"
          onClick={handleSubmit}
        >
          Publier le commentaire
        </Button>
      </Card>

      {/* LIST COMMENTS */}
      <div className="space-y-3 mt-6">
        {comments.length === 0 && (
          <p className="text-sm text-neutral-400">
            Aucun commentaire pour le moment.
          </p>
        )}

        {comments.map((c) => (
          <Card
            key={c.id}
            className="bg-neutral-900 border-neutral-700 p-3"
          >
            <div className="flex justify-between items-center text-xs text-neutral-400">
              <span>
                <strong className="text-neutral-200">
                  {c.author?.username ?? "Utilisateur"}
                </strong>{" "}
                a écrit :
              </span>
              <span>{formatDateTime(c.created_at)}</span>
            </div>
            <p className="mt-2 text-sm text-neutral-100 whitespace-pre-line">
              {c.content}
            </p>
          </Card>
        ))}
      </div>
    </section>
  );
}
