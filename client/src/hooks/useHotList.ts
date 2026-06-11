import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchAllHot, fetchHotPlatform, type MockScenario } from '../api/hot';
import type { HotResponse, HotSource } from '../types/hot';

type PageState = 'loading' | 'success' | 'error';

const minimumFeedbackMs = 350;

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function keepFeedbackVisible(startedAt: number) {
  const elapsed = Date.now() - startedAt;
  const remaining = minimumFeedbackMs - elapsed;

  if (remaining > 0) {
    await wait(remaining);
  }
}

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [retryingSources, setRetryingSources] = useState<ReadonlySet<HotSource>>(
    () => new Set(),
  );

  const loadHotData = useCallback(async () => {
    setPageState('loading');
    setRefreshError(null);

    try {
      const response = await fetchAllHot(scenario);
      setData(response);
      setPageState('success');
    } catch {
      setData(null);
      setPageState('error');
    }
  }, [scenario]);

  const reloadHotData = useCallback(async () => {
    const startedAt = Date.now();
    setIsReloading(true);
    setRefreshError(null);

    try {
      const response = await fetchAllHot(scenario);
      setData(response);
      setPageState('success');
    } catch {
      setPageState('error');
    } finally {
      await keepFeedbackVisible(startedAt);
      setIsReloading(false);
    }
  }, [scenario]);

  const refreshHotData = useCallback(async () => {
    const startedAt = Date.now();
    setIsRefreshing(true);
    setRefreshError(null);

    try {
      const response = await fetchAllHot(scenario);
      setData(response);
      setPageState('success');
    } catch {
      setRefreshError('刷新失败，已保留当前内容');
    } finally {
      await keepFeedbackVisible(startedAt);
      setIsRefreshing(false);
    }
  }, [scenario]);

  const retryPlatform = useCallback(async (source: HotSource) => {
    setRetryingSources((current) => new Set(current).add(source));

    try {
      const recoveredPlatform = await fetchHotPlatform(source);

      setData((current) =>
        current
          ? {
              ...current,
              generatedAt: new Date().toISOString(),
              platforms: current.platforms.map((platform) =>
                platform.source === source ? recoveredPlatform : platform,
              ),
            }
          : {
              generatedAt: new Date().toISOString(),
              platforms: [recoveredPlatform],
            },
      );
      setPageState('success');
    } catch {
      setData((current) =>
        current
          ? {
              ...current,
              platforms: current.platforms.map((platform) =>
                platform.source === source
                  ? {
                      ...platform,
                      status: 'error',
                      message: '重试失败，请稍后再试',
                      errorCode: 'RETRY_FAILED',
                    }
                  : platform,
              ),
            }
          : current,
      );
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
    isReloading,
    isRefreshing,
    pageState,
    refreshError,
    refresh: refreshHotData,
    retryingSources,
    reload: reloadHotData,
    retryPlatform,
  };
}
