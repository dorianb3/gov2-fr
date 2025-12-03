// src/services/issuesService.js
import { supabase } from "../supabase/client";
import { getCurrentUser } from "./authService";

/**
 * Issues d'un topic (avec tri par updated_at décroissant)
 */
export async function getIssuesByTopic(topicId) {
  const { data, error } = await supabase
    .from("issues")
    .select("*")
    .eq("topic_id", topicId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("getIssuesByTopic error:", error);
    throw error;
  }
  return data;
}

export async function getIssue(id) {
  const { data, error } = await supabase
    .from("issues")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getIssue error:", error);
    throw error;
  }
  return data;
}

export async function createIssue({ topic_id, title, description, data_sources }) {
  const user = await getCurrentUser();
  if (!user) throw new Error("AUTH_REQUIRED");

  // Optionnel : rate limit
  const { data: allowed, error: rlError } = await supabase.rpc(
    "check_rate_limit",
    { action_name: "issue" }
  );
  if (rlError) {
    console.error("check_rate_limit(issue) error:", rlError);
  }
  if (allowed === false) {
    throw new Error("RATE_LIMIT_EXCEEDED");
  }

  const { data, error } = await supabase
    .from("issues")
    .insert({
      topic_id,
      title,
      description,
      data_sources: data_sources ?? [],
      created_by: user.id,
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error("createIssue error:", error);
    throw error;
  }

  return data;
}

export async function updateIssue(id, payload) {
  const { data, error } = await supabase
    .from("issues")
    .update(payload)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    console.error("updateIssue error:", error);
    throw error;
  }
  return data;
}

export async function deleteIssue(id) {
  const { error } = await supabase.from("issues").delete().eq("id", id);
  if (error) {
    console.error("deleteIssue error:", error);
    throw error;
  }
}

/**
 * Vue de priorité (issue_priority_view)
 */
export async function getIssuePriorityView() {
  const { data, error } = await supabase
    .from("issue_priority_view")
    .select("*");

  if (error) {
    console.error("getIssuePriorityView error:", error);
    throw error;
  }
  return data;
}
