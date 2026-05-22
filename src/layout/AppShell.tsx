import { Moon, Sun } from 'lucide-react';
import type { ReactNode } from 'react';
import type { ThemeMode, UserProfile } from '../data/types';
import { isFirebaseConfigured } from '../data/firebase';
import { navItems, pageTitles, type Page } from '../app/navigation';
import { resolveTheme } from '../app/theme';

export function AppShell({
  activeUser,
  children,
  demoMode,
  onLogout,
  onNavigate,
  onToggleTheme,
  page,
  themeMode,
}: {
  activeUser: UserProfile;
  children: ReactNode;
  demoMode: boolean;
  onLogout: () => void | Promise<void>;
  onNavigate: (page: Page) => void;
  onToggleTheme: () => void;
  page: Page;
  themeMode: ThemeMode;
}) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">C</div>
          <div>
            <strong>CPA Control</strong>
            <span>MicroSaaS</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="Navegação principal">
          {navItems.map((item) => (
            <button key={item.page} className={page === item.page ? 'nav-item active' : 'nav-item'} onClick={() => onNavigate(item.page)}>
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="user-card">
          <strong>{activeUser.name}</strong>
          <span>{activeUser.email}</span>
          <small>{demoMode ? 'Organização demo' : activeUser.organizationId}</small>
          <button className="logout-button" onClick={() => void onLogout()}>{demoMode ? 'Sair do demo' : 'Sair'}</button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">CPA Control</p>
            <h1>{pageTitles[page]}</h1>
          </div>
          <div className="topbar-actions">
            <span className={isFirebaseConfigured && !demoMode ? 'status-dot online' : 'status-dot'}>
              {isFirebaseConfigured && !demoMode ? 'Firebase conectado' : 'Modo demonstração'}
            </span>
            <button className="icon-button" onClick={onToggleTheme} title="Alternar tema">
              {resolveTheme(themeMode) === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
