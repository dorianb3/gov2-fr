// src/services/profileOverviewService.js
import { supabase } from "../supabase/client";

/**
 * Charge un profil complet via la vue profile_overview_view
 */
export async function getProfileOverview(userId) {
  const { data, error } = await supabase
    .from("profile_overview_view")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("getProfileOverview error:", error);
    throw error;
  }

  return data;
}

/**
 * Version RPC sécurisée (si tu veux utiliser RLS renforcé)
 */
export async function getProfileOverviewRPC(userId) {
  const { data, error } = await supabase.rpc("get_profile_overview", {
    _uid: userId,
  });

  if (error) {
    console.error("getProfileOverviewRPC error:", error);
    throw error;
  }

  return data;
}
