// src/services/proposalStatusService.js
import { supabase } from "../supabase/client";

/**
 * Historique des statuts d'une proposition
 */
export async function getProposalStatusHistory(proposalId) {
  const { data, error } = await supabase
    .from("proposal_status_history")
    .select("*")
    .eq("proposal_id", proposalId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getProposalStatusHistory error:", error);
    throw error;
  }
  return data;
}

/**
 * Changer le statut via RPC change_proposal_status
 */
export async function changeProposalStatus(proposalId, newStatus, comment) {
  const { error } = await supabase.rpc("change_proposal_status", {
    _proposal_id: proposalId,
    _new_status: newStatus,
    _comment: comment ?? null,
  });

  if (error) {
    console.error("changeProposalStatus error:", error);
    throw error;
  }
}
