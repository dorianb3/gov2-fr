// src/services/profileSearchService.js
import { supabase } from "../supabase/client";

/**
 * Recherche utilisateur par username (fuzzy search)
 */
export async function searchProfiles(query) {
  if (!query || query.trim() === "") return [];

  const term = `%${query.trim()}%`;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .ilike("username", term)
    .order("username");

  if (error) {
    console.error("searchProfiles error:", error);
    throw error;
  }

  return data;
}
