// src/services/proposalVersionsService.js
import { supabase } from "../supabase/client";

/**
 * Versions d'une proposition
 */
export async function getProposalVersions(proposalId) {
  const { data, error } = await supabase
    .from("proposal_versions")
    .select("*")
    .eq("proposal_id", proposalId)
    .order("version_number", { ascending: false });

  if (error) {
    console.error("getProposalVersions error:", error);
    throw error;
  }
  return data;
}

/**
 * Une version précise
 */
export async function getProposalVersion(versionId) {
  const { data, error } = await supabase
    .from("proposal_versions")
    .select("*")
    .eq("id", versionId)
    .maybeSingle();

  if (error) {
    console.error("getProposalVersion error:", error);
    throw error;
  }
  return data;
}

/**
 * Restore une version via RPC restore_proposal_version
 */
export async function restoreProposalVersion(versionId) {
  const { error } = await supabase.rpc("restore_proposal_version", {
    _version_id: versionId,
  });

  if (error) {
    console.error("restoreProposalVersion error:", error);
    throw error;
  }
}

/**
 * Petit diff texte naïf (ligne par ligne) – utile pour un futur UI
 */
export function computeTextDiff(oldText = "", newText = "") {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");

  return {
    old: oldLines,
    current: newLines,
  };
}
