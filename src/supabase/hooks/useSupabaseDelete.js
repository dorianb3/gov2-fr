import { supabase } from "../client";

export function useSupabaseDelete(table) {
  return async (id) => {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) throw error;
  };
}
