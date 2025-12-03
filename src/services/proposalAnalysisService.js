// src/services/proposalAnalysisService.js
import { supabase } from "../supabase/client";

/**
 * Analyses liées à une proposition
 */
export async function getProposalAnalyses(proposalId) {
  const { data, error } = await supabase
    .from("proposal_analysis")
    .select("*")
    .eq("proposal_id", proposalId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getProposalAnalyses error:", error);
    throw error;
  }
  return data;
}

/**
 * Ajouter une analyse (fiscal / socioeconomic / legal / benchmark)
 */
export async function addProposalAnalysis({
  proposal_id,
  type,
  summary,
  details,
  generated_by,
}) {
  const { data, error } = await supabase
    .from("proposal_analysis")
    .insert({
      proposal_id,
      type,
      summary,
      details,
      generated_by,
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error("addProposalAnalysis error:", error);
    throw error;
  }
  return data;
}
