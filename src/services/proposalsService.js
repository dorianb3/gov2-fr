// src/services/proposalsService.js
import { supabase } from "../supabase/client";
import { getCurrentUser } from "./authService";

/**
 * Charge une proposition par id
 */
export async function getProposal(id) {
  const { data, error } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getProposal error:", error);
    throw error;
  }
  return data;
}

/**
 * Liste des propositions d'un issue
 */
export async function getProposalsByIssue(issueId) {
  const { data, error } = await supabase
    .from("proposals")
    .select("*")
    .eq("issue_id", issueId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getProposalsByIssue error:", error);
    throw error;
  }
  return data;
}

/**
 * Crée une proposition "from scratch"
 */
export async function createProposal(payload) {
  const user = await getCurrentUser();
  if (!user) throw new Error("AUTH_REQUIRED");

  const { data: allowed, error: rlError } = await supabase.rpc(
    "check_rate_limit",
    { action_name: "proposal" }
  );
  if (rlError) {
    console.error("check_rate_limit(proposal) error:", rlError);
  }
  if (allowed === false) {
    throw new Error("RATE_LIMIT_EXCEEDED");
  }

  const {
    issue_id,
    title,
    content,
    impact_expected,
    estimated_cost,
    data_sources,
    objectives,
    actions,
    means,
    timeline,
    risks,
    territorial_scope,
    target_populations,
    status,
  } = payload;

  const { data, error } = await supabase
    .from("proposals")
    .insert({
      issue_id,
      title,
      content,
      impact_expected: impact_expected ?? null,
      estimated_cost: estimated_cost ?? null,
      data_sources: data_sources ?? [],
      objectives: objectives ?? null,
      actions: actions ?? [],
      means: means ?? [],
      timeline: timeline ?? [],
      risks: risks ?? [],
      territorial_scope: territorial_scope ?? null,
      target_populations: target_populations ?? [],
      status: status ?? "draft",
      created_by: user.id,
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error("createProposal error:", error);
    throw error;
  }

  return data;
}

/**
 * Met à jour une proposition existante
 */
export async function updateProposal(id, payload) {
  const { data, error } = await supabase
    .from("proposals")
    .update(payload)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    console.error("updateProposal error:", error);
    throw error;
  }
  return data;
}

export async function deleteProposal(id) {
  const { error } = await supabase.from("proposals").delete().eq("id", id);
  if (error) {
    console.error("deleteProposal error:", error);
    throw error;
  }
}

/**
 * Crée une proposition "fork" à partir d'une autre
 * - copie le contenu et les champs structurés
 * - set forked_from
 * - crée un lien dans proposal_links (relation = 'fork')
 */
export async function forkProposal(originalProposalId, overrides = {}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("AUTH_REQUIRED");

  // 1) Charger la proposition originale
  const original = await getProposal(originalProposalId);
  if (!original) {
    throw new Error("ORIGINAL_NOT_FOUND");
  }

  // 2) Créer la nouvelle proposition
  const forkPayload = {
    issue_id: original.issue_id,
    title: overrides.title ?? original.title,
    content: overrides.content ?? original.content,
    impact_expected: overrides.impact_expected ?? original.impact_expected,
    estimated_cost: overrides.estimated_cost ?? original.estimated_cost,
    data_sources: overrides.data_sources ?? original.data_sources ?? [],
    objectives: overrides.objectives ?? original.objectives,
    actions: overrides.actions ?? original.actions ?? [],
    means: overrides.means ?? original.means ?? [],
    timeline: overrides.timeline ?? original.timeline ?? [],
    risks: overrides.risks ?? original.risks ?? [],
    territorial_scope:
      overrides.territorial_scope ?? original.territorial_scope,
    target_populations:
      overrides.target_populations ?? original.target_populations ?? [],
    status: overrides.status ?? "draft",
  };

  const { data: newProposal, error } = await supabase
    .from("proposals")
    .insert({
      ...forkPayload,
      forked_from: originalProposalId,
      created_by: user.id,
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error("forkProposal insert error:", error);
    throw error;
  }

  // 3) Créer le lien "fork" dans proposal_links
  const { error: linkError } = await supabase.from("proposal_links").insert({
    source_id: newProposal.id, // nouvelle proposition
    target_id: originalProposalId, // originale
    relation: "fork",
  });

  if (linkError) {
    console.error("forkProposal link error:", linkError);
    // on ne throw pas forcément, la proposition existe déjà
  }

  return newProposal;
}

/**
 * Vue des scores agrégés (proposal_scores_view)
 */
export async function getProposalScores(proposalId) {
  const { data, error } = await supabase
    .from("proposal_scores_view")
    .select("*")
    .eq("id", proposalId)
    .maybeSingle();

  if (error) {
    console.error("getProposalScores error:", error);
    throw error;
  }
  return data;
}

/**
 * Propositions tendances (trending_proposals_view)
 */
export async function getTrendingProposals() {
  const { data, error } = await supabase
    .from("trending_proposals_view")
    .select("*");

  if (error) {
    console.error("getTrendingProposals error:", error);
    throw error;
  }
  return data;
}



/**
 * Recherche de propositions dans un issue donné
 * - filtre par texte (titre / objectifs / contenu)
 * - exclut éventuellement la proposition courante (pour éviter de se lier à soi-même)
 */
export async function searchProposalsByIssue(issueId, searchTerm, options = {}) {
  if (!issueId) return [];

  const { excludeId } = options;

  let query = supabase
    .from("proposals")
    .select("*")
    .eq("issue_id", issueId);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  if (searchTerm && searchTerm.trim() !== "") {
    const term = `%${searchTerm.trim()}%`;
    query = query.or(
      `title.ilike.${term}, objectives.ilike.${term}, content.ilike.${term}`
    );
  }

  const { data, error } = await query.order("created_at", {
    ascending: false,
  });

  if (error) {
    console.error("searchProposalsByIssue error:", error);
    throw error;
  }

  return data || [];
}
