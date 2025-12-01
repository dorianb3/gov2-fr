import { useEffect, useState, useCallback } from "react";
import { supabase } from "../client";

/**
 * Usage:
 * const { data, loading, error, refresh } = useSupabaseQuery("topics", {
 *   select: "*",
 *   filters: (q) => q.eq("id", topicId),
 *   order: { column: "created_at", ascending: false }
 * });
 */
export function useSupabaseQuery(
  table,
  { select = "*", filters = null, order = null } = {}
) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);

    let query = supabase.from(table).select(select);

    if (order) {
      query = query.order(order.column, { ascending: order.ascending });
    }

    if (filters) {
      query = filters(query);
    }

    const { data, error } = await query;

    setData(data);
    setError(error);
    setLoading(false);
  }, [table, select, filters, order]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, error, loading, refresh: fetchData };
}
