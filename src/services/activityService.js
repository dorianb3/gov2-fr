// src/services/activityService.js
import { supabase } from "../supabase/client";

/**
 * Activité globale récente
 */
export async function getRecentActivity(limit = 50) {
  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getRecentActivity error:", error);
    throw error;
  }
  return data;
}

/**
 * Activité liée à une proposition
 */
export async function getActivityForProposal(proposalId) {
  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .eq("target_id", proposalId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getActivityForProposal error:", error);
    throw error;
  }
  return data;
}

/**
 * Activité d'un utilisateur
 */
export async function getActivityForUser(userId) {
  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getActivityForUser error:", error);
    throw error;
  }
  return data;
}
