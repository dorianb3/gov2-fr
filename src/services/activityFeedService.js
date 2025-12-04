// src/services/activityFeedService.js
import { supabase } from "../supabase/client";
import { getCurrentUser } from "./authService";

/**
 * Fil d'activité personnalisé (équivalent Twitter/Github feed)
 * Basé sur ce que l'utilisateur suit.
 */
// export async function getPersonalizedFeed() {
//   const user = await getCurrentUser();
//   if (!user) throw new Error("AUTH_REQUIRED");

//   const { data, error } = await supabase.rpc("get_feed_for_user_v2", {
//     _uid: user.id,
//   });

//   if (error) {
//     console.error("getPersonalizedFeed error:", error);
//     throw error;
//   }

//   return data || [];
// }

/**
 * Fil d'activité personnalisé (équivalent Twitter/GitHub)
 * Basé sur ce que l'utilisateur suit, avec ranking (V3).
 *
 * options (toutes facultatives, dépendent de ta RPC) :
 *  - timeWindow: "24h" | "7d" | "30d" | "all"
 *  - limit: nombre max d'événements
 */
export async function getPersonalizedFeed(options = {}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("AUTH_REQUIRED");

  // Payload minimal pour rester compatible avec ta RPC
  const payload = { _uid: user.id };

  // Si ta fonction V3 accepte ces paramètres avec des defaults, ils seront utilisés
  if (options.timeWindow) {
    payload._time_window = options.timeWindow;
  }
  if (typeof options.limit === "number") {
    payload._limit = options.limit;
  }

  const { data, error } = await supabase.rpc("get_feed_for_user_v3", payload);

  if (error) {
    console.error("getPersonalizedFeed (v3) error:", error);
    throw error;
  }

  return data || [];
}