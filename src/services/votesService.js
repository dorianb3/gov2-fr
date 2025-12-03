// src/services/votesService.js
import { supabase } from "../supabase/client";
import { getCurrentUser } from "./authService";

/**
 * Vote du user courant sur une proposition
 */
export async function getMyVoteForProposal(proposalId) {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("votes")
    .select("*")
    .eq("proposal_id", proposalId)
    .eq("voter_id", user.id)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    console.error("getMyVoteForProposal error:", error);
    throw error;
  }
  return data ?? null;
}

/**
 * Tous les votes d'une proposition
 */
export async function getVotesForProposal(proposalId) {
  const { data, error } = await supabase
    .from("votes")
    .select("*")
    .eq("proposal_id", proposalId);

  if (error) {
    console.error("getVotesForProposal error:", error);
    throw error;
  }
  return data;
}

/**
 * Upsert d'un vote multicritères
 */
export async function upsertVoteForProposal(
  proposalId,
  { priority, impact, feasibility, acceptability, trust }
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("AUTH_REQUIRED");

  const { data, error } = await supabase
    .from("votes")
    .upsert(
      {
        proposal_id: proposalId,
        voter_id: user.id,
        priority_score: priority,
        impact_score: impact,
        feasibility_score: feasibility,
        acceptability_score: acceptability,
        trust_score: trust,
      },
      { onConflict: "proposal_id,voter_id" }
    )
    .select()
    .maybeSingle();

  if (error) {
    console.error("upsertVoteForProposal error:", error);
    throw error;
  }
  return data;
}

/**
 * Supprimer le vote du user courant sur une proposition
 */
export async function deleteMyVoteForProposal(proposalId) {
  const user = await getCurrentUser();
  if (!user) throw new Error("AUTH_REQUIRED");

  const { error } = await supabase
    .from("votes")
    .delete()
    .eq("proposal_id", proposalId)
    .eq("voter_id", user.id);

  if (error) {
    console.error("deleteMyVoteForProposal error:", error);
    throw error;
  }
}
