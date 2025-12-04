import { supabase } from "../supabase/client";
import { getCurrentUser } from "./authService";

/**
 * Vérifie si l'utilisateur actuel a liké une cible
 */
export async function hasLiked(targetType, targetId) {
  const user = await getCurrentUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from("likes")
    .select("id")
    .eq("user_id", user.id)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    console.error("hasLiked error:", error);
    return false;
  }

  return !!data;
}

/**
 * Nombre total de likes pour une cible
 */
export async function getLikesCount(targetType, targetId) {
  const { count, error } = await supabase
    .from("likes")
    .select("id", { count: "exact", head: true })
    .eq("target_type", targetType)
    .eq("target_id", targetId);

  if (error) {
    console.error("getLikesCount error:", error);
    return 0;
  }

  return count || 0;
}

/**
 * Liker une cible
 */
export async function likeTarget(targetType, targetId) {
  const user = await getCurrentUser();
  if (!user) throw new Error("AUTH_REQUIRED");

  const { data, error } = await supabase
    .from("likes")
    .insert({
      user_id: user.id,
      target_type: targetType,
      target_id: targetId,
    })
    .select()
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      // déjà liké
      return null;
    }
    console.error("likeTarget error:", error);
    throw error;
  }

  return data;
}

/**
 * Supprimer un like
 */
export async function unlikeTarget(targetType, targetId) {
  const user = await getCurrentUser();
  if (!user) throw new Error("AUTH_REQUIRED");

  const { error } = await supabase
    .from("likes")
    .delete()
    .eq("user_id", user.id)
    .eq("target_type", targetType)
    .eq("target_id", targetId);

  if (error) {
    console.error("unlikeTarget error:", error);
    throw error;
  }
}

/**
 * Récupérer tous les likes de l’utilisateur
 */
export async function getMyLikes() {
  const user = await getCurrentUser();
  if (!user) throw new Error("AUTH_REQUIRED");

  const { data, error } = await supabase
    .from("likes")
    .select("*")
    .eq("user_id", user.id);

  if (error) {
    console.error("getMyLikes error:", error);
    throw error;
  }

  return data;
}
