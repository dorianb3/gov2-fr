// src/services/followsService.js
import { supabase } from "../supabase/client";
import { getCurrentUser } from "./authService";

/**
 * Vérifie si l'utilisateur suit un élément
 */
export async function isFollowingTarget(targetType, targetId) {
  const user = await getCurrentUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    console.error("isFollowingTarget error:", error);
  }

  return !!data;
}

/**
 * Suivre une cible (user/topic/issue/proposal)
 */
export async function follow(targetType, targetId) {
  const user = await getCurrentUser();
  if (!user) throw new Error("AUTH_REQUIRED");

  const { data, error } = await supabase
    .from("follows")
    .insert({
      follower_id: user.id,
      target_type: targetType,
      target_id: targetId,
    })
    .select()
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return null; // déjà suivi
    }
    console.error("follow error:", error);
    throw error;
  }
  return data;
}

/**
 * Ne plus suivre
 */
export async function unfollow(targetType, targetId) {
  const user = await getCurrentUser();
  if (!user) throw new Error("AUTH_REQUIRED");

  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("target_type", targetType)
    .eq("target_id", targetId);

  if (error) {
    console.error("unfollow error:", error);
    throw error;
  }
}



/**
 * Récupère tout ce que suit l'utilisateur courant
 */
export async function getMyFollows() {
  const user = await getCurrentUser();
  if (!user) throw new Error("AUTH_REQUIRED");

  const { data, error } = await supabase
    .from("follows")
    .select("*")
    .eq("follower_id", user.id);

  if (error) {
    console.error("getMyFollows error:", error);
    throw error;
  }
  return data;
}

export async function getFollowersCount(targetType, targetId) {
  const { count, error } = await supabase
    .from("follows")
    .select("id", { count: "exact", head: true })
    .eq("target_type", targetType)
    .eq("target_id", targetId);

  if (error) {
    console.error("getFollowersCount error:", error);
    return 0;
  }
  return count || 0;
}
