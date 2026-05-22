import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import {
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Copy,
  FileImage,
  Flag,
  Gauge,
  LayoutDashboard,
  Link2,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import { currentUser, goals as initialGoals, houses, invites as initialInvites, operations, operators } from './data/mockData';
import type { BettingHouse, Goal, Invite, ThemeMode, UserProfile } from './data/types';
import {
  createBettingHouseDocument,
  createFirstAdminProfile,
  createGoalDocument,
  createInviteDocument,
  isFirebaseConfigured,
  loginWithEmail,
  logoutFromFirebase,
  subscribeOrganizationLists,
  subscribeToAuthProfile,
  type AuthSession,
} from './data/firebase';
import { currency, percent, shortDate } from './utils/format';
import { getStoredThemeMode, setStoredThemeMode } from './utils/storage';

type Page = 'dashboard' | 'operations' | 'houses' | 'operators' | 'goals' | 'reports' | 'settings';

const navItems: Array<{ page: Page; label: string; icon: ReactNode }> = [
  { page: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { page: 'operations', label: 'Operações', icon: <CalendarDays size={18} /> },
  { page: 'houses', label: 'Casas', icon: <Building2 size={18} /> },
  { page: 'operators', label: 'Operadores', icon: <Users size={18} /> },
  { page: 'goals', label: 'Metas', icon: <Target size={18} /> },
  { page: 'reports', label: 'Relatórios', icon: <BarChart3 size={18} /> },
  { page: 'settings', label: 'Configurações', icon: <Settings size={18} /> },
];

function getInitialTheme(): ThemeMode {
  return getStoredThemeMode();
}

function resolveTheme(mode: ThemeMode) {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  return mode;
}

export function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialTheme);
  const [invites, setInvites] = useState<Invite[]>(initialInvites);
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [bettingHouses, setBettingHouses] = useState<BettingHouse[]>(houses);
  const [selectedOperationId, setSelectedOperationId] = useState(operations[0].id);
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [authProfile, setAuthProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(isFirebaseConfigured);
  const [authError, setAuthError] = useState('');
  const [demoMode, setDemoMode] = useState(!isFirebaseConfigured);
  useEffect(() => {
    setStoredThemeMode(themeMode);
    document.documentElement.dataset.theme = resolveTheme(themeMode);
  }, [themeMode]);

  useEffect(() => {
    if (!isFirebaseConfigured) return;

    let unsubscribe: (() => void) | undefined;
    let active = true;

    void subscribeToAuthProfile((session, profile, error) => {
      if (!active) return;

      setAuthSession(session);
      setAuthProfile(profile);
      setAuthError(error ?? '');
      setAuthLoading(false);
    }).then((cleanup) => {
      unsubscribe = cleanup;
    });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (!authProfile || demoMode) return;

    let unsubscribe: (() => void) | undefined;
    let active = true;

    void subscribeOrganizationLists(authProfile.organizationId, setInvites, setGoals, setBettingHouses).then((cleanup) => {
      if (!active) {
        cleanup();
        return;
      }
      unsubscribe = cleanup;
    });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [authProfile, demoMode]);

  const selectedOperation = operations.find((operation) => operation.id === selectedOperationId) ?? operations[0];
  const activeUser = authProfile ?? currentUser;
  const canUseApp = demoMode || Boolean(authSession && authProfile?.status === 'active');

  const metrics = useMemo(() => {
    let dailyProfit = 0;
    let monthlyProfit = 43163;
    let totalDeposit = 0;
    let totalReturn = 0;
    let activeOperations = 0;
    let activeHouses = 0;

    for (const operation of operations) {
      if (operation.date === '2026-05-21') dailyProfit += operation.profitLoss;
      if (operation.status === 'open') activeOperations += 1;
      monthlyProfit += operation.profitLoss;
      totalDeposit += operation.depositAmount;
      totalReturn += operation.totalReturn;
    }

    for (const house of bettingHouses) {
      if (house.status === 'active') activeHouses += 1;
    }

    const roi = totalDeposit > 0 ? ((totalReturn - totalDeposit) / totalDeposit) * 100 : 0;

    return {
      dailyProfit,
      weeklyProfit: 13730,
      monthlyProfit,
      totalDeposit,
      totalReturn,
      roi,
      activeHouses,
      activeOperations,
    };
  }, [bettingHouses]);

  async function createInvite(email: string) {
    const invite: Invite = {
      id: `invite-${Date.now()}`,
      email,
      role: 'operator',
      status: 'pending',
      link: `${window.location.origin}/accept-invite?token=${crypto.randomUUID()}`,
      expiresAt: '2026-05-29',
    };

    if (authProfile && !demoMode) await createInviteDocument(authProfile, invite);

    setInvites((current) => [invite, ...current]);
  }

  async function createGoal(title: string, targetValue: number) {
    const goal: Goal = {
      id: `goal-${Date.now()}`,
      title,
      scope: 'organization',
      metric: 'profit',
      targetValue,
      currentValue: metrics.monthlyProfit,
      period: 'Maio/2026',
    };

    if (authProfile && !demoMode) await createGoalDocument(authProfile, goal);

    setGoals((current) => [goal, ...current]);
  }

  async function createHouse(name: string, website: string) {
    const house: BettingHouse = {
      id: `house-${Date.now()}`,
      organizationId: activeUser.organizationId,
      name,
      website: website || undefined,
      status: 'active',
      activeOperations: 0,
      deposit: 0,
      returns: 0,
      profit: 0,
      roi: 0,
    };

    if (authProfile && !demoMode) await createBettingHouseDocument(authProfile, house);
    setBettingHouses((current) => [house, ...current]);
  }

  async function login(email: string, password: string) {
    if (!isFirebaseConfigured) {
      setDemoMode(true);
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    try {
      await loginWithEmail(email, password);
      setDemoMode(false);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Não foi possível entrar.');
      setAuthLoading(false);
    }
  }

  async function createFirstAdmin(name: string, organizationName: string, email: string, password: string) {
    setAuthLoading(true);
    setAuthError('');

    try {
      const profile = await createFirstAdminProfile({ name, organizationName, email, password, themeMode });

      setAuthSession({ uid: profile.id, email });
      setAuthProfile(profile);
      setDemoMode(false);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Não foi possível criar o admin.');
    } finally {
      setAuthLoading(false);
    }
  }

  async function logout() {
    if (authSession) await logoutFromFirebase();
    setDemoMode(false);
    setAuthProfile(null);
    setAuthSession(null);
  }

  if (!canUseApp) {
    return (
      <AuthScreen
        loading={authLoading}
        error={authError}
        onLogin={login}
        onCreateFirstAdmin={createFirstAdmin}
        onDemo={() => {
          setAuthError('');
          setDemoMode(true);
        }}
      />
    );
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
          {navItems.map((item) => (
            <button key={item.page} className={page === item.page ? 'nav-item active' : 'nav-item'} onClick={() => setPage(item.page)}>
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="user-card">
          <strong>{activeUser.name}</strong>
          <span>{activeUser.email}</span>
          <small>{demoMode ? 'Organização demo' : activeUser.organizationId}</small>
          <button className="logout-button" onClick={logout}>{demoMode ? 'Sair do demo' : 'Sair'}</button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">CPA Control</p>
            <h1>{pageTitle(page)}</h1>
          </div>
          <div className="topbar-actions">
            <span className={isFirebaseConfigured && !demoMode ? 'status-dot online' : 'status-dot'}>
              {isFirebaseConfigured && !demoMode ? 'Firebase conectado' : 'Modo demonstração'}
            </span>
            <button className="icon-button" onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')} title="Alternar tema">
              {resolveTheme(themeMode) === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        {page === 'dashboard' && <Dashboard metrics={metrics} bettingHouses={bettingHouses} />}
        {page === 'operations' && <Operations selectedOperation={selectedOperation} setSelectedOperationId={setSelectedOperationId} />}
        {page === 'houses' && <Houses bettingHouses={bettingHouses} onCreateHouse={createHouse} />}
        {page === 'operators' && <Operators invites={invites} onInvite={createInvite} />}
        {page === 'goals' && <Goals goals={goals} onCreateGoal={createGoal} />}
        {page === 'reports' && <Reports metrics={metrics} />}
        {page === 'settings' && <SettingsPage themeMode={themeMode} setThemeMode={setThemeMode} />}
      </main>
    </div>
  );
}

function AuthScreen({
  loading,
  error,
  onLogin,
  onCreateFirstAdmin,
  onDemo,
}: {
  loading: boolean;
  error: string;
  onLogin: (email: string, password: string) => Promise<void>;
  onCreateFirstAdmin: (name: string, organizationName: string, email: string, password: string) => Promise<void>;
  onDemo: () => void;
}) {
  const [mode, setMode] = useState<'login' | 'admin'>('login');
  const [name, setName] = useState('Admin CPA');
  const [organizationName, setOrganizationName] = useState('Minha operação CPA');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="brand auth-brand">
          <div className="brand-mark">C</div>
          <div>
            <strong>CPA Control</strong>
            <span>MicroSaaS para casas de aposta</span>
          </div>
        </div>

        <div className="auth-tabs">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Entrar</button>
          <button className={mode === 'admin' ? 'active' : ''} onClick={() => setMode('admin')}>Criar admin</button>
        </div>

        <form
          className="auth-form"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            if (mode === 'login') {
              void onLogin(email, password);
            } else {
              void onCreateFirstAdmin(name, organizationName, email, password);
            }
          }}
        >
          {mode === 'admin' && (
            <>
              <label>
                Nome do admin
                <input value={name} onChange={(event) => setName(event.target.value)} />
              </label>
              <label>
                Organização
                <input value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} />
              </label>
            </>
          )}
          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="admin@email.com" />
          </label>
          <label>
            Senha
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="mínimo 6 caracteres" />
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar com Firebase' : 'Criar primeiro admin'}
          </button>
          <button className="ghost-button" type="button" onClick={onDemo}>
            Entrar em modo demonstração
          </button>
        </form>
      </section>
    </main>
  );
}

function pageTitle(page: Page) {
  const titles: Record<Page, string> = {
    dashboard: 'Dashboard',
    operations: 'Operações',
    houses: 'Casas de apostas',
    operators: 'Operadores',
    goals: 'Metas',
    reports: 'Relatórios',
    settings: 'Configurações',
  };
  return titles[page];
}

type DashboardMetrics = {
  dailyProfit: number;
  weeklyProfit: number;
  monthlyProfit: number;
  totalDeposit: number;
  totalReturn: number;
  roi: number;
  activeHouses: number;
  activeOperations: number;
};

function Dashboard({ metrics, bettingHouses }: { metrics: DashboardMetrics; bettingHouses: BettingHouse[] }) {
  const topHouses = bettingHouses.toSorted((a, b) => b.profit - a.profit).slice(0, 5);

  return (
    <section className="page-grid">
      <div className="stats-grid wide">
        <MetricCard label="Lucro diário" value={currency(metrics.dailyProfit)} hint="hoje" icon={<CalendarDays />} positive />
        <MetricCard label="Lucro semanal" value={currency(metrics.weeklyProfit)} hint="esta semana" icon={<CalendarDays />} positive />
        <MetricCard label="Lucro mensal" value={currency(metrics.monthlyProfit)} hint="este mês" icon={<CalendarDays />} positive />
        <MetricCard label="Depósitos" value={currency(metrics.totalDeposit)} hint="período atual" icon={<ClipboardList />} />
        <MetricCard label="Retorno" value={currency(metrics.totalReturn)} hint="saques + bônus" icon={<TrendingUp />} positive />
        <MetricCard label="ROI" value={percent(metrics.roi)} hint="base depósito" icon={<Gauge />} positive />
        <MetricCard label="Operações abertas" value={String(metrics.activeOperations)} hint="em andamento" icon={<FileImage />} />
        <MetricCard label="Casas ativas" value={`${metrics.activeHouses} de ${bettingHouses.length}`} hint="por organização" icon={<Building2 />} />
      </div>

      <Panel title="Evolução de lucro" subtitle="Últimos 30 dias">
        <div className="chart-line">
          {[18, 32, 21, 64, 26, 82, 28, 44, 92, 34, 71, 24].map((height, index) => (
            <span key={index} style={{ height: `${height}%` }} />
          ))}
        </div>
      </Panel>

      <Panel title="Operações por dia" subtitle="Depósitos, saques, baú e coop">
        <div className="chart-bars">
          {[2, 1, 0, 0, 1, 2, 1, 0, 0, 1, 1, 0].map((height, index) => (
            <span key={index} style={{ height: `${Math.max(height * 30, 6)}%` }} />
          ))}
        </div>
      </Panel>

      <Panel title="Top casas" subtitle="Lucro no período" className="compact-panel">
        <div className="rank-list">
          {topHouses.map((house, index) => (
            <div className="rank-row" key={house.id}>
              <span>{index + 1}</span>
              <div>
                <strong>{house.name}</strong>
                <small>{house.activeOperations} operações</small>
              </div>
              <b>{currency(house.profit)}</b>
            </div>
          ))}
        </div>
      </Panel>
    </section>
  );
}

function Operations({
  selectedOperation,
  setSelectedOperationId,
}: {
  selectedOperation: (typeof operations)[number];
  setSelectedOperationId: (id: string) => void;
}) {
  return (
    <section className="two-column">
      <Panel title="Operações" subtitle="Criação e acompanhamento por casa">
        <div className="toolbar">
          <label className="search-field">
            <Search size={16} />
            <input placeholder="Buscar operação, casa ou operador" />
          </label>
          <button className="primary-button">
            <Plus size={16} />
            Nova operação
          </button>
        </div>
        <div className="operation-list">
          {operations.map((operation) => (
            <button key={operation.id} className={selectedOperation.id === operation.id ? 'operation-item selected' : 'operation-item'} onClick={() => setSelectedOperationId(operation.id)}>
              <div>
                <strong>{operation.bettingHouseName}</strong>
                <span>{operation.operatorName} · {operation.game}</span>
              </div>
              <b>{currency(operation.profitLoss)}</b>
            </button>
          ))}
        </div>
      </Panel>

      <Panel title={`${shortDate(selectedOperation.date)} · ${selectedOperation.bettingHouseName}`} subtitle={`${selectedOperation.operatorName} · ${selectedOperation.game}`}>
        <div className="stats-grid mini">
          <MetricCard label="Depósitos" value={currency(selectedOperation.depositAmount)} tone="danger" />
          <MetricCard label="Saques" value={currency(selectedOperation.withdrawalAmount)} positive />
          <MetricCard label="Retorno" value={currency(selectedOperation.totalReturn)} />
          <MetricCard label="Resultado" value={currency(selectedOperation.profitLoss)} positive />
        </div>

        <div className="section-header">
          <h3>Ciclos ({selectedOperation.cycles.length})</h3>
          <button className="primary-button">
            <Plus size={16} />
            Adicionar ciclo
          </button>
        </div>

        <div className="table">
          <div className="table-row table-head">
            <span>#</span>
            <span>Depósito</span>
            <span>Saque</span>
            <span>Baú/Bônus</span>
            <span>Resultado</span>
            <span>Prova</span>
          </div>
          {selectedOperation.cycles.map((cycle) => (
            <div className="table-row" key={cycle.id}>
              <span>#{cycle.cycleNumber}</span>
              <span>{currency(cycle.deposit)}</span>
              <span>{currency(cycle.withdrawal)}</span>
              <span>{currency(cycle.bonus)}</span>
              <strong>{currency(cycle.result)}</strong>
              <span className="proof-chip">
                <FileImage size={14} />
                {cycle.proofName}
              </span>
            </div>
          ))}
        </div>
      </Panel>
    </section>
  );
}

function Houses({
  bettingHouses,
  onCreateHouse,
}: {
  bettingHouses: BettingHouse[];
  onCreateHouse: (name: string, website: string) => void | Promise<void>;
}) {
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');

  return (
    <section className="page-grid">
      <Panel title="Cadastro e gestão de casas" subtitle="Controle por organização, status e desempenho" className="wide-panel">
        <form
          className="toolbar"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            if (!name.trim()) return;
            void onCreateHouse(name.trim(), website.trim());
            setName('');
            setWebsite('');
          }}
        >
          <label className="search-field">
            <Building2 size={16} />
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome da casa" />
          </label>
          <label className="search-field">
            <Search size={16} />
            <input value={website} onChange={(event) => setWebsite(event.target.value)} placeholder="Site opcional" />
          </label>
          <button className="primary-button" type="submit">
            <Plus size={16} />
            Nova casa
          </button>
        </form>
        <div className="cards-grid">
          {bettingHouses.map((house) => (
            <article className="house-card" key={house.id}>
              <div className="house-avatar">{house.name.slice(0, 2)}</div>
              <div>
                <h3>{house.name}</h3>
                <p>{house.website ?? 'Sem site cadastrado'}</p>
              </div>
              <span className={house.status === 'active' ? 'badge success' : 'badge muted'}>{house.status === 'active' ? 'Ativa' : 'Inativa'}</span>
              <dl>
                <div>
                  <dt>Depósito</dt>
                  <dd>{currency(house.deposit)}</dd>
                </div>
                <div>
                  <dt>Retorno</dt>
                  <dd>{currency(house.returns)}</dd>
                </div>
                <div>
                  <dt>Lucro</dt>
                  <dd>{currency(house.profit)}</dd>
                </div>
                <div>
                  <dt>ROI</dt>
                  <dd>{percent(house.roi)}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </Panel>
    </section>
  );
}

function Operators({ invites, onInvite }: { invites: Invite[]; onInvite: (email: string) => void | Promise<void> }) {
  const [email, setEmail] = useState('');
  const ranked = operators.map((operator, index) => ({
    ...operator,
    profit: [3147, 2616, 2417, 2389][index],
    deposits: [403, 700, 365, 355][index],
  }));

  return (
    <section className="two-column">
      <Panel title="Ranking de operadores" subtitle="Performance, equipe e status">
        <div className="stats-grid mini">
          <MetricCard label="Operadores" value={String(operators.length)} />
          <MetricCard label="Ativos" value={String(operators.filter((operator) => operator.status === 'active').length)} />
          <MetricCard label="Lucro equipe" value={currency(32599)} positive />
        </div>
        <div className="operator-list">
          {ranked.map((operator, index) => (
            <div className="operator-row" key={operator.id}>
              <span className="rank-badge">{index + 1}</span>
              <div className="operator-avatar">{operator.name[0]}</div>
              <div className="operator-main">
                <strong>{operator.name}</strong>
                <span>{operator.deposits} deps · {operator.status === 'active' ? 'ativo' : 'inativo'}</span>
                <div className="progress-track">
                  <i style={{ width: `${82 - index * 8}%` }} />
                </div>
              </div>
              <b>{currency(operator.profit)}</b>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Adicionar usuário por link" subtitle="Convites de uso único por organização">
        <form
          className="invite-form"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            if (!email) return;
            void onInvite(email);
            setEmail('');
          }}
        >
          <label>
            Email do operador
            <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="operador@email.com" type="email" />
          </label>
          <button className="primary-button" type="submit">
            <Link2 size={16} />
            Gerar convite
          </button>
        </form>

        <div className="invite-list">
          {invites.map((invite) => (
            <div className="invite-row" key={invite.id}>
              <div>
                <strong>{invite.email}</strong>
                <span>Expira em {shortDate(invite.expiresAt)}</span>
              </div>
              <button className="ghost-button" onClick={() => navigator.clipboard?.writeText(invite.link)}>
                <Copy size={15} />
                Copiar
              </button>
            </div>
          ))}
        </div>
      </Panel>
    </section>
  );
}

function Goals({ goals, onCreateGoal }: { goals: Goal[]; onCreateGoal: (title: string, targetValue: number) => void | Promise<void> }) {
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('60000');

  return (
    <section className="two-column">
      <Panel title="Metas com progresso" subtitle="Organização, operadores e casas">
        <div className="goal-list">
          {goals.map((goal) => {
            const progress = Math.min((goal.currentValue / goal.targetValue) * 100, 100);
            return (
              <article className="goal-card" key={goal.id}>
                <div>
                  <strong>{goal.title}</strong>
                  <span>{goal.period} · {goal.metric.toUpperCase()}</span>
                </div>
                <b>{progress.toFixed(0)}%</b>
                <div className="progress-track">
                  <i style={{ width: `${progress}%` }} />
                </div>
                <small>{currency(goal.currentValue)} de {goal.metric === 'roi' ? percent(goal.targetValue) : currency(goal.targetValue)}</small>
              </article>
            );
          })}
        </div>
      </Panel>

      <Panel title="Nova meta" subtitle="MVP focado em lucro mensal">
        <form
          className="invite-form"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            void onCreateGoal(title || 'Nova meta de lucro', Number(target));
            setTitle('');
          }}
        >
          <label>
            Título
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Meta de lucro da equipe" />
          </label>
          <label>
            Valor alvo
            <input value={target} onChange={(event) => setTarget(event.target.value)} type="number" />
          </label>
          <button className="primary-button" type="submit">
            <Flag size={16} />
            Criar meta
          </button>
        </form>
      </Panel>
    </section>
  );
}

function Reports({ metrics }: { metrics: DashboardMetrics }) {
  return (
    <section className="page-grid">
      <div className="stats-grid wide">
        <MetricCard label="Lucro diário" value={currency(metrics.dailyProfit)} positive />
        <MetricCard label="Lucro mensal" value={currency(metrics.monthlyProfit)} positive />
        <MetricCard label="Depósito período" value={currency(metrics.totalDeposit)} />
        <MetricCard label="Retorno período" value={currency(metrics.totalReturn)} positive />
        <MetricCard label="ROI período" value={percent(metrics.roi)} positive />
      </div>
      <Panel title="Relatório por casa" subtitle="ROI, depósito, retorno e lucro">
        <div className="table">
          <div className="table-row table-head">
            <span>Casa</span>
            <span>Depósito</span>
            <span>Retorno</span>
            <span>Lucro</span>
            <span>ROI</span>
          </div>
          {houses.map((house) => (
            <div className="table-row" key={house.id}>
              <strong>{house.name}</strong>
              <span>{currency(house.deposit)}</span>
              <span>{currency(house.returns)}</span>
              <strong>{currency(house.profit)}</strong>
              <span>{percent(house.roi)}</span>
            </div>
          ))}
        </div>
      </Panel>
    </section>
  );
}

function SettingsPage({ themeMode, setThemeMode }: { themeMode: ThemeMode; setThemeMode: (mode: ThemeMode) => void }) {
  return (
    <section className="two-column">
      <Panel title="Preferências" subtitle="Tema e ambiente">
        <div className="theme-options">
          {(['system', 'light', 'dark'] as ThemeMode[]).map((mode) => (
            <button key={mode} className={themeMode === mode ? 'theme-option active' : 'theme-option'} onClick={() => setThemeMode(mode)}>
              {mode === 'dark' ? <Moon /> : <Sun />}
              <span>{mode === 'system' ? 'Sistema' : mode === 'light' ? 'Claro' : 'Escuro'}</span>
            </button>
          ))}
        </div>
      </Panel>
      <Panel title="Firebase" subtitle="Integração pronta para ambiente real">
        <div className="settings-list">
          <div>
            <strong>Status</strong>
            <span>{isFirebaseConfigured ? 'Configurado por .env' : 'Aguardando variáveis VITE_FIREBASE_*'}</span>
          </div>
          <div>
            <strong>Dados</strong>
            <span>Mock local até conectar Authentication, Firestore e Storage</span>
          </div>
          <div>
            <strong>Storage</strong>
            <span>Comprovantes dos ciclos serão enviados para Firebase Storage</span>
          </div>
        </div>
      </Panel>
    </section>
  );
}

function MetricCard({
  label,
  value,
  hint,
  icon,
  positive,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  positive?: boolean;
  tone?: 'danger';
}) {
  return (
    <article className="metric-card">
      <div>
        <span>{label}</span>
        <strong className={tone === 'danger' ? 'danger-text' : positive ? 'success-text' : undefined}>{value}</strong>
        {hint && <small>{hint}</small>}
      </div>
      {icon && <div className="metric-icon">{icon}</div>}
    </article>
  );
}

function Panel({
  title,
  subtitle,
  children,
  className = '',
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}
