import type { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Public Hotlist Monitor</p>
          <h1>今日热搜</h1>
        </div>
        <p className="topbar-note">微博热搜 / 知乎热搜词 / B 站热门</p>
      </header>
      <main>{children}</main>
      <footer className="footer">
        数据来源于公开页面或公开接口。本项目仅用于全栈学习与非商用演示。
      </footer>
    </div>
  );
}
