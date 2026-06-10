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
  const { data, pageState, reload, retryingSources, retryPlatform } = useHotList();

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
        <button type="button" onClick={() => void reload()}>
          重新加载
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
        <div>
          <span>页面生成</span>
          <strong>{formatGeneratedAt(data.generatedAt)}</strong>
        </div>
      </section>

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
