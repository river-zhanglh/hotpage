const DEFAULT_ZHIHU_TOP_SEARCH_URL = 'https://www.zhihu.com/api/v4/search/top_search';
const ZHIHU_TOP_SEARCH_URL = process.env.ZHIHU_TOP_SEARCH_URL ?? DEFAULT_ZHIHU_TOP_SEARCH_URL;

const requestHeaders = {
  Accept: 'application/json,text/plain,*/*',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36',
};

function createUpstreamError(message, code, cause) {
  const error = new Error(message);
  error.code = code;
  error.cause = cause;
  return error;
}

function parseZhihuItem(rawItem, index) {
  // 知乎热搜词标题来自 top_search.words[].display_query，缺失时兜底使用 query。
  const title = String(rawItem?.display_query ?? rawItem?.query ?? '').trim();

  if (!title) {
    return null;
  }

  // 知乎热搜词接口没有稳定 heat 字段，排名使用数组顺序。
  return {
    rank: index + 1,
    title,
    url: `https://www.zhihu.com/search?type=content&q=${encodeURIComponent(title)}`,
  };
}

export async function fetchZhihuHot() {
  let payload;

  try {
    const response = await fetch(ZHIHU_TOP_SEARCH_URL, { headers: requestHeaders });

    if (!response.ok) {
      throw createUpstreamError(
        `知乎热搜词接口返回 HTTP ${response.status}`,
        'UPSTREAM_FETCH_FAILED',
      );
    }

    payload = await response.json();
  } catch (error) {
    if (error?.code) {
      throw error;
    }

    throw createUpstreamError('知乎热搜词请求失败', 'UPSTREAM_FETCH_FAILED', error);
  }

  const words = payload?.top_search?.words;

  if (!Array.isArray(words)) {
    throw createUpstreamError('知乎热搜词响应缺少 top_search.words 数组', 'UPSTREAM_PARSE_FAILED');
  }

  return words.map(parseZhihuItem).filter(Boolean).slice(0, 10);
}
