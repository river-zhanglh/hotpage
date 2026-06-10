import type { HotPlatform, HotSource } from '../types/hot';

type HotCardProps =
  | {
      loading: true;
      sourceName: string;
      listName: string;
    }
  | {
      loading?: false;
      platform: HotPlatform;
      onRetry?: (source: HotSource) => void;
    };

interface CardShellProps {
  children: React.ReactNode;
  className?: string;
  listName: string;
  sourceName: string;
  statusLabel: string;
}

function CardShell({ children, className = '', listName, sourceName, statusLabel }: CardShellProps) {
  return (
    <section className={`hot-card ${className}`}>
      <div className="card-head">
        <div>
          <p className="source-name">{sourceName}</p>
          <h2>{listName}</h2>
        </div>
        <span className="status-pill">{statusLabel}</span>
      </div>
      {children}
    </section>
  );
}

interface EmptyStateProps {
  platform: HotPlatform;
  onRetry?: (source: HotSource) => void;
}

const statusLabels: Record<HotPlatform['status'], string> = {
  success: '已更新',
  stale: '缓存数据',
  error: '更新失败',
  empty: '暂无数据',
};

function EmptyState({ onRetry, platform }: EmptyStateProps) {
  const isError = platform.status === 'error';
  const message =
    platform.message ??
    (isError ? '当前平台暂时不可用，请稍后重试' : '当前没有可展示内容');

  return (
    <div className={`empty-state empty-state--${platform.status}`}>
      <p>{message}</p>
      {isError ? (
        <button type="button" onClick={() => onRetry?.(platform.source)}>
          点击重试
        </button>
      ) : null}
    </div>
  );
}

function formatTime(value: string | null) {
  if (!value) {
    return '暂无成功记录';
  }

  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function HotCard(props: HotCardProps) {
  if (props.loading) {
    return (
      <CardShell
        className="hot-card--loading"
        listName={props.listName}
        sourceName={props.sourceName}
        statusLabel="加载中"
      >
        <div className="skeleton-list" aria-hidden="true">
          {Array.from({ length: 10 }, (_, index) => (
            <div className="skeleton-row" key={index}>
              <span className="skeleton-rank" />
              <span className="skeleton-line" />
              <span className="skeleton-heat" />
            </div>
          ))}
        </div>
        <div className="card-meta">正在获取最新数据</div>
      </CardShell>
    );
  }

  const { onRetry, platform } = props;
  const hasItems = platform.items.length > 0;

  return (
    <CardShell
      className={`hot-card--${platform.status}`}
      listName={platform.listName}
      sourceName={platform.sourceName}
      statusLabel={statusLabels[platform.status]}
    >
      {hasItems ? (
        <ol className="hot-list">
          {platform.items.map((item) => (
            <li key={`${platform.source}-${item.rank}-${item.title}`}>
              <span className={`rank rank--${item.rank <= 3 ? item.rank : 'default'}`}>
                {item.rank}
              </span>
              <a href={item.url} target="_blank" rel="noreferrer">
                {item.title}
              </a>
              {item.heat ? <span className="heat">{item.heat}</span> : null}
            </li>
          ))}
        </ol>
      ) : (
        <EmptyState onRetry={onRetry} platform={platform} />
      )}

      <div className="card-meta">
        <span>更新于 {formatTime(platform.updatedAt)}</span>
        {platform.message ? <span>{platform.message}</span> : null}
      </div>
    </CardShell>
  );
}
