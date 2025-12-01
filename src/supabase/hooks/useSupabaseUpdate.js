import { supabase } from "../client";

export function useSupabaseUpdate(table) {
  return async (id, values) => {
    const { data, error } = await supabase
      .from(table)
      .update(values)
      .eq("id", id)
      .select();

    if (error) throw error;
    return data?.[0] ?? null;
  };
}
