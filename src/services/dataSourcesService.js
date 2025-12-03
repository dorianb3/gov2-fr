// src/services/dataSourcesService.js
import { supabase } from "../supabase/client";

/**
 * Toutes les sources de données
 */
export async function getAllDataSources() {
  const { data, error } = await supabase
    .from("data_sources")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getAllDataSources error:", error);
    throw error;
  }
  return data;
}

/**
 * Créer une source (modérateur)
 */
export async function createDataSource({ url, label, type }) {
  const { data, error } = await supabase
    .from("data_sources")
    .insert({
      url,
      label,
      type,
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error("createDataSource error:", error);
    throw error;
  }
  return data;
}

/**
 * Marquer une source comme validée via RPC validate_source
 */
export async function validateDataSource(id) {
  const { error } = await supabase.rpc("validate_source", { _id: id });
  if (error) {
    console.error("validateDataSource error:", error);
    throw error;
  }
}
