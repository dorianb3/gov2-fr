// src/components/proposals/ProposalReviewsSection.jsx
import {
  Card,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function ProposalReviewsSection({
  reviews,
  onSubmitReview,
  formatDateTime,
}) {
  const [reviewData, setReviewData] = useState({
    category: "clarity",
    comment: "",
    score: 0,
  });
  const [error, setError] = useState("");

  const handleSubmit = () => {
    setError("");
    if (!reviewData.comment.trim()) {
      setError("Merci de détailler ta review.");
      return;
    }
    onSubmitReview({
      category: reviewData.category,
      comment: reviewData.comment.trim(),
      score: Number(reviewData.score) || 0,
    });
    setReviewData({ category: "clarity", comment: "", score: 0 });
  };

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-2xl font-semibold">Reviews structurées</h2>
        <p className="text-sm text-neutral-400 mt-1">
          Analyses qualitatives par les citoyens, experts ou élus.
        </p>
      </div>

      <Card className="bg-neutral-900 border-neutral-700 p-5 space-y-5">
        {/* FORM */}
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={reviewData.category}
              onChange={(e) =>
                setReviewData((prev) => ({
                  ...prev,
                  category: e.target.value,
                }))
              }
              className="bg-neutral-800 border border-neutral-600 p-2 rounded text-sm"
            >
              <option value="clarity">Clarté</option>
              <option value="feasibility">Faisabilité</option>
              <option value="cost">Coût</option>
              <option value="impact">Impact</option>
              <option value="risks">Risques</option>
              <option value="legal">Juridique</option>
            </select>

            <Input
              type="number"
              min={0}
              max={5}
              value={reviewData.score}
              onChange={(e) =>
                setReviewData((prev) => ({
                  ...prev,
                  score: Number(e.target.value),
                }))
              }
              className="w-20 h-8 text-sm"
            />
          </div>

          <Textarea
            placeholder="Propose une analyse argumentée (points forts, limites, conditions de réussite, etc.)"
            value={reviewData.comment}
            onChange={(e) =>
              setReviewData((prev) => ({
                ...prev,
                comment: e.target.value,
              }))
            }
            className="min-h-[120px]"
          />

          {error && <p className="text-xs text-red-400">{error}</p>}

          <Button
            className="bg-primary text-black w-fit"
            onClick={handleSubmit}
          >
            Publier la review
          </Button>
        </div>

        <Separator className="bg-neutral-700" />

        {/* LIST OF REVIEWS */}
        <div className="space-y-4">
          {reviews.length === 0 && (
            <p className="text-sm text-neutral-400">
              Aucune review pour le moment. Sois le premier à proposer une
              analyse structurée.
            </p>
          )}

          {reviews.map((r) => (
            <div
              key={r.id}
              className="bg-neutral-800 border border-neutral-700 p-4 rounded-md"
            >
              <div className="flex justify-between items-center gap-3">
                <div className="text-sm text-neutral-300">
                  <span className="font-semibold text-neutral-100">
                    {r.reviewer?.username ?? "Utilisateur"}
                  </span>
                  {r.reviewer?.role && (
                    <>
                      {" "}
                      —{" "}
                      <span className="italic text-neutral-400">
                        {r.reviewer.role}
                      </span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="uppercase text-xs">
                    {r.category}
                  </Badge>
                  <span className="text-xs text-neutral-400">
                    Score : {r.score} / 5
                  </span>
                </div>
              </div>

              <p className="mt-2 text-sm text-neutral-100 whitespace-pre-line">
                {r.comment}
              </p>

              <div className="text-[11px] text-neutral-500 mt-2">
                Publiée le {formatDateTime(r.created_at)}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}
