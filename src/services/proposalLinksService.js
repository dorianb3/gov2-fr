// src/services/proposalLinksService.js
import { supabase } from "../supabase/client";

/**
 * Renvoie tous les liens associés à une proposition
 * (avec jointure sur les propositions source / target)
 */
export async function getProposalLinks(proposalId) {
  const { data, error } = await supabase
    .from("proposal_links")
    .select(`
      *,
      source:source_id (
        id, title, status, created_at
      ),
      target:target_id (
        id, title, status, created_at
      )
    `)
    .or(`source_id.eq.${proposalId},target_id.eq.${proposalId}`);

  if (error) {
    console.error("getProposalLinks error:", error);
    throw error;
  }
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
    .select(`
      source_id,
      source:source_id (id, title, status, created_at)
    `)
    .eq("relation", "fork")
    .eq("target_id", originalId);

  if (error) {
    console.error("getForksOfProposal error:", error);
    throw error;
  }

  // on retourne directement les propositions enfants
  return data?.map((row) => row.source) ?? [];
}

/**
 * Parent fork d'une proposition (si elle-même est un fork)
 */
export async function getForkParent(proposalId) {
  const { data, error } = await supabase
    .from("proposal_links")
    .select(`
      target_id,
      parent:target_id (id, title, status, created_at)
    `)
    .eq("relation", "fork")
    .eq("source_id", proposalId)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    console.error("getForkParent error:", error);
    throw error;
  }

  return data?.parent ?? null;
}

/**
 * Crée un lien générique entre deux propositions
 * - accepte soit (sourceId, targetId, relation)
 * - soit un objet { source_id, target_id, relation }
 */
export async function createProposalLink(arg1, arg2, arg3) {
  let payload;

  if (typeof arg1 === "object" && arg1 !== null) {
    // Signature objet
    payload = {
      source_id: arg1.source_id,
      target_id: arg1.target_id,
      relation: arg1.relation,
    };
  } else {
    // Signature (sourceId, targetId, relation)
    payload = {
      source_id: arg1,
      target_id: arg2,
      relation: arg3,
    };
  }

  const { data, error } = await supabase
    .from("proposal_links")
    .insert(payload)
    .select()
    .maybeSingle();

  if (error) {
    console.error("createProposalLink error:", error);
    throw error;
  }

  return data;
}
