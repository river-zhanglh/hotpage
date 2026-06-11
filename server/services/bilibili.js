const DEFAULT_BILIBILI_POPULAR_URL =
  'https://api.bilibili.com/x/web-interface/popular?ps=10&pn=1';
const BILIBILI_POPULAR_URL = process.env.BILIBILI_POPULAR_URL ?? DEFAULT_BILIBILI_POPULAR_URL;

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

function parseBilibiliItem(rawItem, index) {
  // B 站热门标题来自 data.list[].title。
  const title = String(rawItem?.title ?? '').trim();
  const bvid = String(rawItem?.bvid ?? '').trim();
  const shortLink = String(rawItem?.short_link_v2 ?? '').trim();

  if (!title || (!bvid && !shortLink)) {
    return null;
  }

  const item = {
    rank: index + 1,
    title,
    // B 站优先使用 bvid 生成标准视频页链接，缺失时兜底使用 short_link_v2。
    url: bvid ? `https://www.bilibili.com/video/${bvid}` : shortLink,
  };

  // B 站热度使用 data.list[].stat.view，含义是播放量；缺失时不返回 heat。
  if (rawItem?.stat?.view !== undefined && rawItem?.stat?.view !== null) {
    item.heat = String(rawItem.stat.view);
  }

  return item;
}

export async function fetchBilibiliHot() {
  let payload;

  try {
    const response = await fetch(BILIBILI_POPULAR_URL, { headers: requestHeaders });

    if (!response.ok) {
      throw createUpstreamError(
        `B 站热门接口返回 HTTP ${response.status}`,
        'UPSTREAM_FETCH_FAILED',
      );
    }

    payload = await response.json();
  } catch (error) {
    if (error?.code) {
      throw error;
    }

    throw createUpstreamError('B 站热门请求失败', 'UPSTREAM_FETCH_FAILED', error);
  }

  const list = payload?.data?.list;

  if (!Array.isArray(list)) {
    throw createUpstreamError('B 站热门响应缺少 data.list 数组', 'UPSTREAM_PARSE_FAILED');
  }

  return list.map(parseBilibiliItem).filter(Boolean).slice(0, 10);
}
