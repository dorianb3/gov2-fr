// src/services/authService.js
import { supabase } from "../supabase/client";

/**
 * Retourne l'utilisateur connecté (ou null)
 */
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    return null;
  }
  return data.user;
}

/**
 * Retourne la session actuelle (ou null)
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error("getSession error:", error);
    return null;
  }
  return data.session;
}

/**
 * Retourne le rôle de l'utilisateur via la RPC get_user_role()
 * (citizen | expert | moderator | elected)
 */
export async function getCurrentUserRole() {
  const { data, error } = await supabase.rpc("get_user_role");

  if (error) {
    console.error("getCurrentUserRole RPC error:", error);
    return null;
  }

  return data;
}

/**
 * Connexion par email / mot de passe
 */
export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("signIn error:", error);
    throw error;
  }

  return data;
}

/**
 * Déconnexion
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("signOut error:", error);
    throw error;
  }
}



/**
 * Retourne l'utilisateur + son profil
 * { user: SupabaseUser | null, profile: ProfileRow | null }
 */
export async function getCurrentUserWithProfile() {
  // 1) récupérer user
  const { data: authData, error: authError } = await supabase.auth.getUser();
  const user = authData?.user ?? null;

  if (authError || !user) {
    return { user: null, profile: null };
  }

  // 2) récupérer profil
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("getCurrentUserWithProfile profile error:", profileError);
    return { user, profile: null };
  }

  return { user, profile };
}
