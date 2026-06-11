import type { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-title">
          <p className="eyebrow">Public Hotlist Monitor</p>
          <h1>今日热搜</h1>
        </div>
        <p className="topbar-note">微博热搜 / 知乎热搜词 / B 站热门</p>
      </header>
      <main>{children}</main>
      <footer className="footer">
        <span>个人全栈学习项目，非官方服务。</span>
        <span>数据来源于各平台公开信息，更新频率约 5 分钟。</span>
        <span>如有侵权或违规，请联系 contact@example.com。</span>
      </footer>
    </div>
  );
}
