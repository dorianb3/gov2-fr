// src/services/topicsService.js
import { supabase } from "../supabase/client";

export async function getAllTopics() {
  const { data, error } = await supabase
    .from("topics")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getAllTopics error:", error);
    throw error;
  }
  return data;
}

export async function createTopic({ name, description }) {
  const { data, error } = await supabase
    .from("topics")
    .insert({ name, description })
    .select()
    .maybeSingle();

  if (error) {
    console.error("createTopic error:", error);
    throw error;
  }
  return data;
}

export async function updateTopic(id, payload) {
  const { data, error } = await supabase
    .from("topics")
    .update(payload)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    console.error("updateTopic error:", error);
    throw error;
  }
  return data;
}
