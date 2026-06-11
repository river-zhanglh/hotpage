const DEFAULT_WEIBO_HOT_URL = 'https://weibo.com/ajax/side/hotSearch';
const WEIBO_HOT_URL = process.env.WEIBO_HOT_URL ?? DEFAULT_WEIBO_HOT_URL;

const requestHeaders = {
  Accept: 'application/json,text/plain,*/*',
  Referer: 'https://weibo.com/',
  'User-Agent':
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
};

function createUpstreamError(message, code, cause) {
  const error = new Error(message);
  error.code = code;
  error.cause = cause;
  return error;
}

function parseWeiboItem(rawItem, index) {
  // 微博热搜标题来自 data.realtime[].word，缺失时兜底使用 note。
  const title = String(rawItem?.word ?? rawItem?.note ?? '').trim();

  if (!title) {
    return null;
  }

  // 微博排名优先使用 data.realtime[].realpos，缺失时使用数组下标。
  const realpos = Number(rawItem?.realpos);
  const rank = Number.isInteger(realpos) && realpos > 0 ? realpos : index + 1;
  const item = {
    rank,
    title,
    url: `https://s.weibo.com/weibo?q=${encodeURIComponent(title)}`,
  };

  // 微博热度来自 data.realtime[].num；该字段不保证永远存在，所以作为可选字段。
  if (rawItem?.num !== undefined && rawItem?.num !== null && rawItem.num !== '') {
    item.heat = String(rawItem.num);
  }

  return item;
}

export async function fetchWeiboHot() {
  let payload;

  try {
    const response = await fetch(WEIBO_HOT_URL, { headers: requestHeaders });

    if (!response.ok) {
      throw createUpstreamError(
        `微博热搜接口返回 HTTP ${response.status}`,
        'UPSTREAM_FETCH_FAILED',
      );
    }

    payload = await response.json();
  } catch (error) {
    if (error?.code) {
      throw error;
    }

    throw createUpstreamError('微博热搜请求失败', 'UPSTREAM_FETCH_FAILED', error);
  }

  const realtime = payload?.data?.realtime;

  if (!Array.isArray(realtime)) {
    throw createUpstreamError('微博热搜响应缺少 data.realtime 数组', 'UPSTREAM_PARSE_FAILED');
  }

  return realtime.map(parseWeiboItem).filter(Boolean).slice(0, 10);
}
