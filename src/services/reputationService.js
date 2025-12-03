// src/services/reputationService.js
import { supabase } from "../supabase/client";
import { getCurrentUser } from "./authService";

/**
 * Retourne la réputation d'un user (ou 0 si pas de ligne)
 */
export async function getReputation(userId) {
  const { data, error } = await supabase
    .from("user_reputation")
    .select("score, last_update")
    .eq("user_id", userId)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    console.error("getReputation error:", error);
    throw error;
  }

  if (!data) {
    return { score: 0, last_update: null };
  }

  return data;
}

/**
 * S'assure qu'une ligne de réputation existe pour l'utilisateur courant
 */
export async function ensureReputationForCurrentUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("AUTH_REQUIRED");

  const { error } = await supabase.rpc("ensure_reputation_exists");
  if (error) {
    console.error("ensureReputationExists error:", error);
    throw error;
  }
}

/**
 * Top contributeurs (par score décroissant)
 */
export async function getTopContributors(limit = 10) {
  const { data, error } = await supabase
    .from("user_reputation")
    .select("user_id, score, last_update")
    .order("score", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getTopContributors error:", error);
    throw error;
  }

  return data;
}
