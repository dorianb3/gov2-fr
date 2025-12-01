import { useEffect, useState, useCallback } from "react";
import { supabase } from "../client";

export function useSupabaseSingle(table, id, { select = "*" } = {}) {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchItem = useCallback(async () => {
    if (!id) return;

    setLoading(true);

    const { data, error } = await supabase
      .from(table)
      .select(select)
      .eq("id", id)
      .single();

    if (error) console.error(error);

    setItem(data);
    setLoading(false);
  }, [table, id, select]);

  useEffect(() => {
    fetchItem();
  }, [fetchItem]);

  return { item, loading, refresh: fetchItem };
}
