import { useState, useEffect, useCallback } from 'react';

export function useApiData(fetchFn, options = {}) {
  const { 
    pollMs = 0, 
    deps = [], 
    isEmpty = (data) => !data 
  } = options;
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchFn();
      setData(result);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, ...deps]);

  useEffect(() => {
    fetchData();
    
    if (pollMs > 0) {
      const interval = setInterval(fetchData, pollMs);
      return () => clearInterval(interval);
    }
  }, [fetchData, pollMs]);

  const empty = isEmpty(data);
  const refetch = fetchData;

  return { data, loading, error, empty, lastUpdated, refetch };
}

export default useApiData;
