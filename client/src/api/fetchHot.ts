import mockHot from '../mock/hot.json';
import type { HotResponse } from '../types/hot';

export type MockScenario = 'success' | 'platform-error' | 'empty' | 'stale' | 'page-error';

function delay(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function cloneMockHot() {
  return structuredClone(mockHot) as HotResponse;
}

function applyMockScenario(response: HotResponse, scenario: MockScenario) {
  if (scenario === 'platform-error') {
    return {
      ...response,
      platforms: response.platforms.map((platform) =>
        platform.source === 'zhihu'
          ? {
              ...platform,
              status: 'error' as const,
              updatedAt: null,
              items: [],
              message: '知乎热搜词暂时不可用，请稍后重试',
              errorCode: 'MOCK_PLATFORM_ERROR',
            }
          : platform,
      ),
    };
  }

  if (scenario === 'empty') {
    return {
      ...response,
      platforms: response.platforms.map((platform) =>
        platform.source === 'zhihu'
          ? {
              ...platform,
              status: 'empty' as const,
              items: [],
              message: '当前没有可展示的知乎热搜词',
            }
          : platform,
      ),
    };
  }

  if (scenario === 'stale') {
    return {
      ...response,
      platforms: response.platforms.map((platform) =>
        platform.source === 'bilibili'
          ? {
              ...platform,
              status: 'stale' as const,
              message: 'B 站刷新失败，当前展示缓存数据',
              errorCode: 'MOCK_STALE_CACHE',
            }
          : platform,
      ),
    };
  }

  return response;
}

export async function fetchHot(scenario: MockScenario = 'success'): Promise<HotResponse> {
  await delay(500);

  if (scenario === 'page-error') {
    throw new Error('Mock page level error');
  }

  return applyMockScenario(cloneMockHot(), scenario);
}
