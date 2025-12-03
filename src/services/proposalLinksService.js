// src/services/proposalLinksService.js
import { supabase } from "../supabase/client";

/**
 * Renvoie tous les liens associés à une proposition
 * (source OU target)
 */
// export async function getProposalLinks(proposalId) {
//   const { data, error } = await supabase
//     .from("proposal_links")
//     .select("*")
//     .or(`source_id.eq.${proposalId},target_id.eq.${proposalId}`);

//   console.log("getProposalLinks => data", data)
//   if (error) {
//     console.error("getProposalLinks error:", error);
//     throw error;
//   }
//   return data;
// }
export async function getProposalLinks(proposalId) {
  const { data, error } = await supabase
    .from("proposal_links")
    .select(`
      *,
      source:source_id (
        id, title
      ),
      target:target_id (
        id, title
      )
    `)
    .or(`source_id.eq.${proposalId},target_id.eq.${proposalId}`);

  if (error) throw error;
  return data;
}

/**
 * Alternatives symétriques entre deux propositions
 */
export async function linkAsAlternative(aId, bId) {
  const { error } = await supabase.from("proposal_links").insert([
    {
      source_id: aId,
      target_id: bId,
      relation: "alternative",
    },
  ]);

  if (error) {
    console.error("linkAsAlternative error:", error);
    throw error;
  }
}

/**
 * Lien supersedes (newProposal remplace oldProposal)
 */
export async function linkAsSupersedes(newProposalId, oldProposalId) {
  const { error } = await supabase.from("proposal_links").insert({
    source_id: newProposalId,
    target_id: oldProposalId,
    relation: "supersedes",
  });

  if (error) {
    console.error("linkAsSupersedes error:", error);
    throw error;
  }
}

/**
 * Forks enfants d'une proposition (les variantes)
 */
export async function getForksOfProposal(originalId) {
  const { data, error } = await supabase
    .from("proposal_links")
    .select("source_id")
    .eq("relation", "fork")
    .eq("target_id", originalId);

  if (error) {
    console.error("getForksOfProposal error:", error);
    throw error;
  }

  return data?.map((row) => row.source_id) ?? [];
}

/**
 * Parent fork d'une proposition (si elle-même est un fork)
 */
export async function getForkParent(proposalId) {
  const { data, error } = await supabase
    .from("proposal_links")
    .select("target_id")
    .eq("relation", "fork")
    .eq("source_id", proposalId)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    console.error("getForkParent error:", error);
    throw error;
  }

  return data?.target_id ?? null;
}



/**
 * Crée un lien générique entre deux propositions
 * relation ∈ ['fork', 'alternative', 'supersedes', 'superseded_by']
 */
export async function createProposalLink(sourceId, targetId, relation) {
  const { data, error } = await supabase
    .from("proposal_links")
    .insert({
      source_id: sourceId,
      target_id: targetId,
      relation,
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error("createProposalLink error:", error);
    throw error;
  }

  return data;
}
