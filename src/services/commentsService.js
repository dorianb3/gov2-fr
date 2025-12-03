// src/services/commentsService.js
import { supabase } from "../supabase/client";
import { getCurrentUser } from "./authService";

/**
 * Commentaires d'une proposition
 */
export async function getCommentsForProposal(proposalId) {
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("proposal_id", proposalId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getCommentsForProposal error:", error);
    throw error;
  }
  return data;
}

/**
 * Ajouter un commentaire
 */
export async function addCommentToProposal(proposalId, content) {
  const user = await getCurrentUser();
  if (!user) throw new Error("AUTH_REQUIRED");

  const { data, error } = await supabase
    .from("comments")
    .insert({
      proposal_id: proposalId,
      author_id: user.id,
      content,
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error("addCommentToProposal error:", error);
    throw error;
  }
  return data;
}

/**
 * Supprimer un commentaire
 */
export async function deleteComment(commentId) {
  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId);

  if (error) {
    console.error("deleteComment error:", error);
    throw error;
  }
}
