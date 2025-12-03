// src/services/reviewsService.js
import { supabase } from "../supabase/client";
import { getCurrentUser } from "./authService";

/**
 * Reviews d'une proposition
 */
export async function getReviewsForProposal(proposalId) {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("proposal_id", proposalId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getReviewsForProposal error:", error);
    throw error;
  }
  return data;
}

/**
 * Créer une review
 */
export async function addReviewForProposal({
  proposal_id,
  category,
  score,
  comment,
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("AUTH_REQUIRED");

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      proposal_id,
      reviewer_id: user.id,
      category,
      score,
      comment,
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error("addReviewForProposal error:", error);
    throw error;
  }
  return data;
}

/**
 * Supprimer une review par id (si auteur ou modérateur)
 */
export async function deleteReview(reviewId) {
  const { error } = await supabase.from("reviews").delete().eq("id", reviewId);
  if (error) {
    console.error("deleteReview error:", error);
    throw error;
  }
}
