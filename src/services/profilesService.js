// src/services/profilesService.js
import { supabase } from "../supabase/client";
import { getCurrentUser } from "./authService";

/**
 * Charge le profil par id
 */
export async function getProfile(id) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getProfile error:", error);
    throw error;
  }
  return data;
}

/**
 * Charge plusieurs profils d'un coup
 */
export async function getProfilesByIds(ids = []) {
  if (!ids.length) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .in("id", ids);

  if (error) {
    console.error("getProfilesByIds error:", error);
    throw error;
  }
  return data;
}

/**
 * Met à jour SON propre profil (username, bio, avatar_url)
 */
export async function updateOwnProfile({ username, bio, avatar_url }) {
  const user = await getCurrentUser();
  if (!user) throw new Error("AUTH_REQUIRED");

  const { data, error } = await supabase
    .from("profiles")
    .update({ username, bio, avatar_url })
    .eq("id", user.id)
    .select()
    .maybeSingle();

  if (error) {
    console.error("updateOwnProfile error:", error);
    throw error;
  }
  return data;
}
