// src/services/flagsService.js
import { supabase } from "../supabase/client";

export async function getFlagsSummary(targetType, targetId) {
  const { data, error } = await supabase
    .from("flags")
    .select("id")
    .eq("target_type", targetType)
    .eq("target_id", targetId);

  if (error) {
    console.error("Error loading flags:", error);
    return { count: 0 };
  }
  return { count: data?.length || 0 };
}

export const getFlagsCountForTarget = async (targetType, targetId) => {
  const res = await getFlagsSummary(targetType, targetId);
  return res.count ?? 0;
};


export async function hasUserFlagged(targetType, targetId) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return { user: null, alreadyFlagged: false };

  const { data, error } = await supabase
    .from("flags")
    .select("id")
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .eq("flagged_by", user.id)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    console.error("Error checking user flag:", error);
  }

  return { user, alreadyFlagged: !!data };
}

export async function submitFlag({
  targetType,
  targetId,
  reason,
  details,
}) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return { ok: false, error: "AUTH_REQUIRED" };
  }

  // (Optionnel) Rate limit
  // const { data: allowed } = await supabase.rpc("check_rate_limit", {
  //   action_name: "flag",
  // });
  // if (allowed === false) {
  //   return { ok: false, error: "RATE_LIMIT" };
  // }

  const { error } = await supabase.from("flags").insert({
    flagged_by: user.id,
    target_type: targetType,
    target_id: targetId,
    reason,   // enum
    details,  // texte libre optionnel
  });

  if (error) {
    // gestion du doublon (unique constraint) → user a déjà flaggé
    if (error.code === "23505") {
      return { ok: false, error: "ALREADY_FLAGGED" };
    }
    console.error("Flag insert error:", error);
    return { ok: false, error: "UNKNOWN" };
  }

  return { ok: true };
}
