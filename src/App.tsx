import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Page } from './app/navigation';
import { resolveTheme } from './app/theme';
import { currentUser, goals as initialGoals, houses, invites as initialInvites, operations as initialOperations } from './data/mockData';
import type { BettingHouse, Cycle, DashboardMetrics, Goal, Invite, Operation, ThemeMode, UserProfile } from './data/types';
import {
  acceptInviteWithPassword,
  createBettingHouseDocument,
  createCycleDocument,
  createFirstAdminProfile,
  createGoalDocument,
  createInviteDocument,
  createOperationDocument,
  isFirebaseConfigured,
  loginWithEmail,
  loginWithGoogle,
  logoutFromFirebase,
  subscribeOrganizationLists,
  subscribeToAuthProfile,
  type AuthSession,
} from './data/firebase';
import { AcceptInviteScreen } from './features/auth/AcceptInviteScreen';
import { AuthScreen } from './features/auth/AuthScreen';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { GoalsPage } from './features/goals/GoalsPage';
import { HousesPage } from './features/houses/HousesPage';
import { OperationsPage } from './features/operations/OperationsPage';
import { OperatorsPage } from './features/operators/OperatorsPage';
import { ReportsPage } from './features/reports/ReportsPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { AppShell } from './layout/AppShell';
import { getStoredThemeMode, setStoredThemeMode } from './utils/storage';

function createLocalId(prefix: string) {
  return `${prefix}-${Date.now()}`;
}

function getInitialTheme(): ThemeMode {
  return getStoredThemeMode();
}

function calculateMetrics(appOperations: Operation[], bettingHouses: BettingHouse[]): DashboardMetrics {
  let dailyProfit = 0;
  let monthlyProfit = 43163;
  let totalDeposit = 0;
  let totalReturn = 0;
  let activeOperations = 0;
  let activeHouses = 0;

  for (const operation of appOperations) {
    if (operation.date === '2026-05-21') dailyProfit += operation.profitLoss;
    if (operation.status === 'open') activeOperations += 1;
    monthlyProfit += operation.profitLoss;
    totalDeposit += operation.depositAmount;
    totalReturn += operation.totalReturn;
  }

  for (const house of bettingHouses) {
    if (house.status === 'active') activeHouses += 1;
  }

  return {
    dailyProfit,
    weeklyProfit: 13730,
    monthlyProfit,
    totalDeposit,
    totalReturn,
    roi: totalDeposit > 0 ? ((totalReturn - totalDeposit) / totalDeposit) * 100 : 0,
    activeHouses,
    activeOperations,
  };
}

export function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialTheme);
  const [invites, setInvites] = useState<Invite[]>(initialInvites);
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [bettingHouses, setBettingHouses] = useState<BettingHouse[]>(houses);
  const [appOperations, setAppOperations] = useState<Operation[]>(initialOperations);
  const [selectedOperationId, setSelectedOperationId] = useState(initialOperations[0].id);
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

    void subscribeOrganizationLists(authProfile.organizationId, setInvites, setGoals, setBettingHouses, setAppOperations).then((cleanup) => {
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

  const activeUser = authProfile ?? currentUser;
  const canUseApp = demoMode || Boolean(authSession && authProfile?.status === 'active');
  const metrics = useMemo(() => calculateMetrics(appOperations, bettingHouses), [appOperations, bettingHouses]);
  const selectedOperation = appOperations.find((operation) => operation.id === selectedOperationId) ?? appOperations[0];
  const inviteId = useMemo(() => new URLSearchParams(window.location.search).get('invite'), []);
  const isAcceptInviteRoute = window.location.pathname === '/accept-invite';

  async function createInvite(email: string) {
    const id = createLocalId('invite');
    const invite: Invite = {
      id,
      email,
      role: 'operator',
      status: 'pending',
      link: `${window.location.origin}/accept-invite?invite=${id}`,
      expiresAt: '2026-05-29',
    };

    if (authProfile && !demoMode) await createInviteDocument(authProfile, invite);
    setInvites((current) => [invite, ...current]);
  }

  async function createGoal(title: string, targetValue: number) {
    const goal: Goal = {
      id: createLocalId('goal'),
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
      id: createLocalId('house'),
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

  async function createOperation(date: string, houseId: string, game: string) {
    const house = bettingHouses.find((item) => item.id === houseId) ?? bettingHouses[0];
    if (!house) return;

    const operation: Operation = {
      id: createLocalId('operation'),
      organizationId: activeUser.organizationId,
      operatorId: activeUser.id,
      operatorName: activeUser.name,
      bettingHouseId: house.id,
      bettingHouseName: house.name,
      game,
      date,
      status: 'open',
      depositAmount: 0,
      withdrawalAmount: 0,
      totalReturn: 0,
      profitLoss: 0,
      roi: 0,
      proofCount: 0,
      cycles: [],
    };

    if (authProfile && !demoMode) await createOperationDocument(authProfile, operation);
    setAppOperations((current) => [operation, ...current]);
    setSelectedOperationId(operation.id);
  }

  async function addCycle(operationId: string, values: Omit<Cycle, 'id' | 'cycleNumber' | 'roi'>, proofFile?: File | null) {
    const operation = appOperations.find((item) => item.id === operationId);
    if (!operation) return;

    const result = values.withdrawal + values.bonus - values.deposit;
    const cycle: Cycle = {
      id: createLocalId('cycle'),
      cycleNumber: operation.cycles.length + 1,
      deposit: values.deposit,
      withdrawal: values.withdrawal,
      bonus: values.bonus,
      result,
      roi: values.deposit > 0 ? (result / values.deposit) * 100 : 0,
      proofName: proofFile?.name ?? values.proofName,
    };

    if (authProfile && !demoMode) await createCycleDocument(authProfile, operation, cycle, proofFile);

    setAppOperations((current) =>
      current.map((item) => {
        if (item.id !== operationId) return item;

        const depositAmount = item.depositAmount + cycle.deposit;
        const withdrawalAmount = item.withdrawalAmount + cycle.withdrawal;
        const totalReturn = item.totalReturn + cycle.withdrawal + cycle.bonus;
        const profitLoss = item.profitLoss + cycle.result;

        return {
          ...item,
          depositAmount,
          withdrawalAmount,
          totalReturn,
          profitLoss,
          roi: depositAmount > 0 ? (profitLoss / depositAmount) * 100 : 0,
          proofCount: item.proofCount + (proofFile ? 1 : 0),
          cycles: [...item.cycles, cycle],
        };
      }),
    );
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

  async function loginGoogle() {
    if (!isFirebaseConfigured) {
      setDemoMode(true);
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    try {
      await loginWithGoogle();
      setDemoMode(false);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Não foi possível entrar com Google.');
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

  async function acceptInvite(inviteIdValue: string, name: string, email: string, password: string) {
    if (!isFirebaseConfigured) {
      setAuthError('Configure o Firebase para aceitar convites reais.');
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    try {
      await acceptInviteWithPassword({ inviteId: inviteIdValue, name, email, password });
      window.history.replaceState({}, '', '/');
      setDemoMode(false);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Não foi possível aceitar o convite.');
      setAuthLoading(false);
    }
  }

  async function logout() {
    if (authSession) await logoutFromFirebase();
    setDemoMode(false);
    setAuthProfile(null);
    setAuthSession(null);
  }

  if (isAcceptInviteRoute && !canUseApp) {
    return (
      <AcceptInviteScreen
        inviteId={inviteId}
        loading={authLoading}
        error={authError}
        onAcceptInvite={acceptInvite}
        onBackToLogin={() => {
          window.history.replaceState({}, '', '/');
          window.location.reload();
        }}
      />
    );
  }

  if (!canUseApp) {
    return (
      <AuthScreen
        loading={authLoading}
        error={authError}
        onLogin={login}
        onGoogleLogin={loginGoogle}
        onCreateFirstAdmin={createFirstAdmin}
        onDemo={() => {
          setAuthError('');
          setDemoMode(true);
        }}
      />
    );
  }

  const pages: Record<Page, ReactNode> = {
    dashboard: <DashboardPage metrics={metrics} bettingHouses={bettingHouses} />,
    operations: (
      <OperationsPage
        bettingHouses={bettingHouses}
        operations={appOperations}
        selectedOperation={selectedOperation}
        setSelectedOperationId={setSelectedOperationId}
        onCreateOperation={createOperation}
        onAddCycle={addCycle}
      />
    ),
    houses: <HousesPage bettingHouses={bettingHouses} onCreateHouse={createHouse} />,
    operators: <OperatorsPage invites={invites} onInvite={createInvite} />,
    goals: <GoalsPage goals={goals} onCreateGoal={createGoal} />,
    reports: <ReportsPage metrics={metrics} bettingHouses={bettingHouses} />,
    settings: <SettingsPage themeMode={themeMode} setThemeMode={setThemeMode} />,
  };

  return (
    <AppShell
      activeUser={activeUser}
      demoMode={demoMode}
      onLogout={logout}
      onNavigate={setPage}
      onToggleTheme={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
      page={page}
      themeMode={themeMode}
    >
      {pages[page] ?? <DashboardPage metrics={metrics} bettingHouses={bettingHouses} />}
    </AppShell>
  );
}
