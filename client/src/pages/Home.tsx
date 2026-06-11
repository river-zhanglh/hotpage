import { HotCard } from '../components/HotCard';
import { useHotList } from '../hooks/useHotList';
import type { HotSource } from '../types/hot';

function formatGeneratedAt(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

const loadingCards: Array<{ source: HotSource; sourceName: string; listName: string }> = [
  { source: 'weibo', sourceName: '微博', listName: '热搜' },
  { source: 'zhihu', sourceName: '知乎', listName: '热搜词' },
  { source: 'bilibili', sourceName: 'B 站', listName: '热门' },
];

export function Home() {
  const {
    data,
    isReloading,
    isRefreshing,
    pageState,
    refresh,
    refreshError,
    reload,
    retryingSources,
    retryPlatform,
  } = useHotList();

  if (pageState === 'loading') {
    return (
      <>
        <div className="page-state page-state--loading">正在加载热点数据...</div>
        <section className="card-grid" aria-label="热点列表加载中">
          {loadingCards.map((card) => (
            <HotCard
              key={card.source}
              listName={card.listName}
              loading
              sourceName={card.sourceName}
            />
          ))}
        </section>
      </>
    );
  }

  if (pageState === 'error') {
    return (
      <div className="page-state page-state--error">
        <p>热点数据加载失败，请稍后重试。</p>
        <button
          aria-busy={isReloading}
          className={`refresh-button${isReloading ? ' refresh-button--loading' : ''}`}
          disabled={isReloading}
          onClick={() => void reload()}
          type="button"
        >
          <span className="refresh-button__icon" aria-hidden="true">
            ↻
          </span>
          <span>{isReloading ? '加载中' : '重新加载'}</span>
        </button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <>
      <section className="summary-strip" aria-label="页面摘要">
        <div>
          <span>平台</span>
          <strong>{data.platforms.length}</strong>
        </div>
        <div>
          <span>每个平台</span>
          <strong>Top 10</strong>
        </div>
        <div className="summary-strip__action-cell">
          <span className="summary-strip__metric">
            <span>页面生成</span>
            <strong>{formatGeneratedAt(data.generatedAt)}</strong>
          </span>
          <button
            aria-busy={isRefreshing}
            className={`refresh-button${isRefreshing ? ' refresh-button--loading' : ''}`}
            disabled={isRefreshing}
            onClick={() => void refresh()}
            type="button"
          >
            <span className="refresh-button__icon" aria-hidden="true">
              ↻
            </span>
            <span>{isRefreshing ? '更新中' : '重新加载'}</span>
          </button>
        </div>
      </section>

      {refreshError ? (
        <div className="refresh-notice" role="status">
          {refreshError}
        </div>
      ) : null}

      <section className="card-grid" aria-label="热点列表">
        {data.platforms.map((platform) =>
          retryingSources.has(platform.source) ? (
            <HotCard
              key={platform.source}
              listName={platform.listName}
              loading
              sourceName={platform.sourceName}
            />
          ) : (
            <HotCard
              key={platform.source}
              onRetry={retryPlatform}
              platform={platform}
            />
          ),
        )}
      </section>
    </>
  );
}
