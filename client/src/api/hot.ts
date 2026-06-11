import type { HotPlatform, HotResponse, HotSource } from '../types/hot';

export type MockScenario = 'success' | 'platform-error' | 'empty' | 'stale' | 'page-error';

interface FetchAllHotOptions {
  refresh?: boolean;
}

const apiBase = import.meta.env.VITE_API_BASE ?? '';

function buildApiUrl(path: string, params?: Record<string, string>) {
  const url = new URL(`${apiBase}${path}`, window.location.origin);

  Object.entries(params ?? {}).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return url.toString();
}

async function requestJson<T>(path: string, params?: Record<string, string>): Promise<T> {
  const response = await fetch(buildApiUrl(path, params));

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function fetchAllHot(scenario: MockScenario = 'success', options: FetchAllHotOptions = {}) {
  const params: Record<string, string> = {};

  if (scenario !== 'success') {
    params.mock = scenario;
  }

  if (options.refresh) {
    params.refresh = '1';
  }

  return requestJson<HotResponse>(
    '/api/hot',
    Object.keys(params).length > 0 ? params : undefined,
  );
}

export function fetchHotPlatform(source: HotSource) {
  return requestJson<HotPlatform>(`/api/hot/${source}`);
}
