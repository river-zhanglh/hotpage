import cors from 'cors';
import express from 'express';
import {
  applyMockScenario,
  getHotPlatform,
  supportedSources,
} from './mockHotData.js';
import { fetchBilibiliHot } from './services/bilibili.js';
import { fetchWeiboHot } from './services/weibo.js';
import { fetchZhihuHot } from './services/zhihu.js';
import { defaultTtlSec, getCache, getStaleCache, setCache } from './utils/cache.js';

const app = express();
const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? '0.0.0.0';
const clientOrigin = process.env.CLIENT_ORIGIN;
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  ...(clientOrigin ? [clientOrigin] : []),
];
const hotSources = Array.from(supportedSources);
const platformMessages = {
  weibo: {
    empty: '当前没有可展示的微博热搜',
    error: '微博热搜暂时不可用，请稍后重试',
    stale: '微博刷新失败，当前展示缓存数据',
  },
  zhihu: {
    empty: '当前没有可展示的知乎热搜词',
    error: '知乎热搜词暂时不可用，请稍后重试',
    stale: '知乎刷新失败，当前展示缓存数据',
  },
  bilibili: {
    empty: '当前没有可展示的 B 站热门内容',
    error: 'B 站热门暂时不可用，请稍后重试',
    stale: 'B 站刷新失败，当前展示缓存数据',
  },
};
const adapterFetchers = {
  weibo: fetchWeiboHot,
  zhihu: fetchZhihuHot,
  bilibili: fetchBilibiliHot,
};

function isRefreshRequest(request) {
  return request.query.refresh === '1';
}

function getCacheKey(source) {
  return `hot:${source}`;
}

function getPlatformMeta(source) {
  const platform = getHotPlatform(source);

  if (!platform) {
    return null;
  }

  return {
    source: platform.source,
    sourceName: platform.sourceName,
    listName: platform.listName,
  };
}

function createPlatform(source, status, items, updatedAt, extra = {}) {
  const meta = getPlatformMeta(source);

  if (!meta) {
    return null;
  }

  return {
    ...meta,
    status,
    updatedAt,
    items,
    ...extra,
  };
}

function resolveErrorCode(error) {
  return typeof error?.code === 'string' ? error.code : 'UPSTREAM_FETCH_FAILED';
}

async function getPlatformWithCache(source, refresh = false) {
  const cacheKey = getCacheKey(source);

  if (!refresh) {
    const cachedPlatform = getCache(cacheKey);

    if (cachedPlatform) {
      console.log(`[cache hit] ${cacheKey}`);
      return cachedPlatform;
    }
  }

  if (!adapterFetchers[source]) {
    return null;
  }

  try {
    const items = await adapterFetchers[source]();
    const updatedAt = new Date().toISOString();

    if (items.length === 0) {
      const stalePlatform = getStaleCache(cacheKey);

      console.log(`[cache empty] ${cacheKey}`);
      return createPlatform(source, 'empty', [], stalePlatform?.updatedAt ?? null, {
        errorCode: 'UPSTREAM_EMPTY',
        message: platformMessages[source]?.empty,
      });
    }

    const platform = createPlatform(source, 'success', items, updatedAt);

    console.log(`[cache miss] ${cacheKey}`);
    return setCache(cacheKey, platform);
  } catch (error) {
    const stalePlatform = getStaleCache(cacheKey);
    const errorCode = resolveErrorCode(error);

    console.error(`[upstream error] ${cacheKey}: ${error.message}`);

    if (stalePlatform) {
      return {
        ...stalePlatform,
        status: 'stale',
        message: platformMessages[source]?.stale,
        errorCode,
      };
    }

    return createPlatform(source, 'error', [], null, {
      errorCode,
      message: platformMessages[source]?.error,
    });
  }
}

app.use(
  cors({
    origin: allowedOrigins,
  }),
);
app.use(express.json());

app.use((request, _response, next) => {
  console.log(`${request.method} ${request.path}`);
  next();
});

app.get('/api/health', (_request, response) => {
  response.json({ ok: true });
});

app.get('/api/hot', async (request, response) => {
  const scenario = request.query.mock;
  const refresh = isRefreshRequest(request);

  if (scenario === 'page-error') {
    response.status(500).json({ message: 'Mock page level error' });
    return;
  }

  const platforms = await Promise.all(
    hotSources.map((source) => getPlatformWithCache(source, refresh)),
  );

  response.json({
    generatedAt: new Date().toISOString(),
    platforms: applyMockScenario(platforms, typeof scenario === 'string' ? scenario : 'success'),
  });
});

app.get('/api/hot/:source', async (request, response) => {
  const { source } = request.params;

  if (!supportedSources.has(source)) {
    response.status(404).json({ message: `Unsupported hot source: ${source}` });
    return;
  }

  response.json(await getPlatformWithCache(source, isRefreshRequest(request)));
});

const server = app.listen(port, host, () => {
  console.log(`hotpage server listening on http://${host}:${port}`);
  console.log(`hotpage cache ttl: ${defaultTtlSec}s`);
});

server.on('error', (error) => {
  console.error('Failed to start hotpage server:', error);
  process.exit(1);
});
