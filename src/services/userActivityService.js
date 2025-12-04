// src/services/userActivityService.js
import { supabase } from "../supabase/client";

/**
 * Activité d'un user (enrichie via la vue activity_enriched_view)
 */
export async function getEnrichedActivityForUser(userId, limit = 50) {
  const { data, error } = await supabase
    .from("activity_enriched_view")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getEnrichedActivityForUser error:", error);
    throw error;
  }

  return data;
}

/**
 * Activité globale enrichie
 */
export async function getGlobalEnrichedActivity(limit = 50) {
  const { data, error } = await supabase
    .from("activity_enriched_view")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getGlobalEnrichedActivity error:", error);
    throw error;
  }

  return data;
}
