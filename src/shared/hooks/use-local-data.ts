import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { onSynchronized } from '../../features/sync/application/sync-engine';

export function useLocalData<T>(loader: () => Promise<T>) {
  const loaderRef = useRef(loader);
  useEffect(() => { loaderRef.current = loader; });
  const [data, setData] = useState<T>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const reload = useCallback(async () => {
    try {
      setData(await loaderRef.current());
      setError(undefined);
    } catch {
      setError('Não foi possível ler os dados deste aparelho.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void reload(); }, [reload]));
  useEffect(() => onSynchronized(() => { void reload(); }), [reload]);

  return { data, loading, error, reload };
}
