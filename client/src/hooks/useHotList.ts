import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchHot, type MockScenario } from '../api/fetchHot';
import type { HotResponse, HotSource } from '../types/hot';

type PageState = 'loading' | 'success' | 'error';

function readMockScenario(): MockScenario {
  const value = new URLSearchParams(window.location.search).get('mock');

  if (
    value === 'platform-error' ||
    value === 'empty' ||
    value === 'stale' ||
    value === 'page-error'
  ) {
    return value;
  }

  return 'success';
}

export function useHotList() {
  const scenario = useMemo(() => readMockScenario(), []);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [data, setData] = useState<HotResponse | null>(null);
  const [retryingSources, setRetryingSources] = useState<ReadonlySet<HotSource>>(
    () => new Set(),
  );

  const loadHotData = useCallback(async () => {
    setPageState('loading');

    try {
      const response = await fetchHot(scenario);
      setData(response);
      setPageState('success');
    } catch {
      setData(null);
      setPageState('error');
    }
  }, [scenario]);

  const retryPlatform = useCallback(async (source: HotSource) => {
    setRetryingSources((current) => new Set(current).add(source));

    try {
      const response = await fetchHot('success');
      const recoveredPlatform = response.platforms.find((platform) => platform.source === source);

      if (recoveredPlatform) {
        setData((current) =>
          current
            ? {
                ...current,
                generatedAt: response.generatedAt,
                platforms: current.platforms.map((platform) =>
                  platform.source === source ? recoveredPlatform : platform,
                ),
              }
            : response,
        );
        setPageState('success');
      }
    } finally {
      setRetryingSources((current) => {
        const next = new Set(current);
        next.delete(source);
        return next;
      });
    }
  }, []);

  useEffect(() => {
    void loadHotData();
  }, [loadHotData]);

  return {
    data,
    pageState,
    retryingSources,
    reload: loadHotData,
    retryPlatform,
  };
}
