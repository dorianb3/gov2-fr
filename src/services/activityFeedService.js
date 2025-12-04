// src/services/activityFeedService.js
import { supabase } from "../supabase/client";
import { getCurrentUser } from "./authService";

/**
 * Fil d'activité personnalisé (équivalent Twitter/Github feed)
 * Basé sur ce que l'utilisateur suit.
 */
export async function getPersonalizedFeed() {
  const user = await getCurrentUser();
  if (!user) throw new Error("AUTH_REQUIRED");

  const { data, error } = await supabase.rpc("get_feed_for_user_v2", {
    _uid: user.id,
  });

  if (error) {
    console.error("getPersonalizedFeed error:", error);
    throw error;
  }

  return data || [];
}
