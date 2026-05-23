import { Bell, Moon, Sun } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import type { AuditLog, ThemeMode, UserProfile } from '../data/types';
import { isFirebaseConfigured } from '../data/firebase';
import { getNavItemsForRole, pageDescriptions, pageTitles, type Page } from '../app/navigation';
import { resolveTheme } from '../app/theme';

export function AppShell({
  activeUser,
  auditLogs,
  children,
  demoMode,
  onLogout,
  onNavigate,
  onToggleTheme,
  page,
  themeMode,
}: {
  activeUser: UserProfile;
  auditLogs: AuditLog[];
  children: ReactNode;
  demoMode: boolean;
  onLogout: () => void | Promise<void>;
  onNavigate: (page: Page) => void;
  onToggleTheme: () => void;
  page: Page;
  themeMode: ThemeMode;
}) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [seenCount, setSeenCount] = useState(auditLogs.length);
  const latestNotifications = useMemo(() => auditLogs.slice(0, 6), [auditLogs]);
  const availableNavItems = useMemo(() => getNavItemsForRole(activeUser.role), [activeUser.role]);
  const unreadCount = Math.max(auditLogs.length - seenCount, 0);

  function toggleNotifications() {
    setNotificationsOpen((current) => !current);
    setSeenCount(auditLogs.length);
  }

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
          {availableNavItems.map((item) => (
            <button key={item.page} className={page === item.page ? 'nav-item active' : 'nav-item'} onClick={() => onNavigate(item.page)} aria-current={page === item.page ? 'page' : undefined}>
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="user-card">
          <strong>{activeUser.name}</strong>
          <span>{activeUser.email}</span>
          <small>{demoMode ? 'Organização demo' : activeUser.organizationId}</small>
          <small className="role-chip">{activeUser.role === 'controller' ? 'Controlador' : 'Operador'}</small>
          <button className="logout-button" onClick={() => void onLogout()}>{demoMode ? 'Sair do demo' : 'Sair'}</button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">CPA Control</p>
            <h1>{pageTitles[page]}</h1>
            <span className="page-description">{pageDescriptions[page]}</span>
          </div>
          <div className="topbar-actions">
            <span className={isFirebaseConfigured && !demoMode ? 'status-dot online' : 'status-dot'}>
              {isFirebaseConfigured && !demoMode ? 'Firebase conectado' : 'Modo demonstração'}
            </span>
            {activeUser.role === 'controller' ? (
              <div className="notification-wrap">
                <button className="icon-button notification-button" onClick={toggleNotifications} title="Notificações administrativas" type="button">
                  <Bell size={18} />
                  {unreadCount > 0 ? <span className="notification-count">{unreadCount}</span> : null}
                </button>
                {notificationsOpen ? (
                  <div className="notification-panel">
                    <div className="notification-heading">
                      <strong>Notificações</strong>
                      <span>Ações administrativas em tempo real</span>
                    </div>
                    <div className="notification-list">
                      {latestNotifications.length === 0 ? <span className="notification-empty">Nenhum evento recente.</span> : null}
                      {latestNotifications.map((log) => (
                        <article className="notification-item" key={log.id}>
                          <strong>{log.summary}</strong>
                          <span>{log.actorName}</span>
                        </article>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
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
