import { supabase } from "../client";

export function useSupabaseInsert(table) {
  return async (values) => {
    const { data, error } = await supabase.from(table).insert(values).select();

    if (error) throw error;
    return data?.[0] ?? null;
  };
}
