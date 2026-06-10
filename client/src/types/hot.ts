export type HotSource = 'weibo' | 'zhihu' | 'bilibili';

export type HotStatus = 'success' | 'stale' | 'error' | 'empty';

export interface HotItem {
  rank: number;
  title: string;
  url: string;
  heat?: string;
}

export interface HotPlatform {
  source: HotSource;
  sourceName: string;
  listName: string;
  status: HotStatus;
  updatedAt: string | null;
  items: HotItem[];
  message?: string;
  errorCode?: string;
}

export interface HotResponse {
  generatedAt: string;
  platforms: HotPlatform[];
}
