// src/services/contributionsService.js
import { supabase } from "../supabase/client";

/**
 * Récupère toutes les contributions d’un utilisateur
 * (issues, proposals, reviews, votes)
 */
export async function getUserContributions(userId) {
  const { data, error } = await supabase.rpc("get_user_contributions", {
    _uid: userId,
  });

  if (error) {
    console.error("getUserContributions error:", error);
    throw error;
  }

  return data || {
    issues: [],
    proposals: [],
    reviews: [],
    votes: [],
  };
}
