import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { canAccessPage, type Page } from './app/navigation';
import { resolveTheme, subscribeToSystemTheme } from './app/theme';
import { auditLogs as initialAuditLogs, currentUser, goals as initialGoals, houses, invites as initialInvites, operations as initialOperations, operators as initialOperators } from './data/mockData';
import type { AuditLog, BettingHouse, Cycle, DashboardMetrics, Goal, Invite, Operation, ThemeMode, UserProfile } from './data/types';
import {
  acceptInviteWithGoogle,
  createBettingHouseDocument,
  createCycleDocument,
  createFirstAdminProfile,
  createGoalDocument,
  createInviteDocument,
  createOperationDocument,
  getBootstrapStatus,
  isFirebaseConfigured,
  loginWithGoogle,
  logoutFromFirebase,
  subscribeOrganizationLists,
  subscribeToAuthProfile,
  updateBettingHouseDocument,
  updateGoalStatusDocument,
  updateOperationStatusDocument,
  updateOperatorStatusDocument,
  type AuthSession,
} from './data/firebase';
import { AcceptInviteScreen } from './features/auth/AcceptInviteScreen';
import { AuthScreen } from './features/auth/AuthScreen';
import { AuditPage } from './features/audit/AuditPage';
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

function parseLocalDate(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function isSameDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
}

function isSameMonth(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
}

function getWeekStart(date: Date) {
  const weekStart = new Date(date);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(date.getDate() - date.getDay());
  return weekStart;
}

function calculateMetrics(appOperations: Operation[], bettingHouses: BettingHouse[]): DashboardMetrics {
  let dailyProfit = 0;
  let weeklyProfit = 0;
  let monthlyProfit = 0;
  let totalDeposit = 0;
  let totalReturn = 0;
  let activeOperations = 0;
  let activeHouses = 0;
  const today = new Date();
  const weekStart = getWeekStart(today);

  for (const operation of appOperations) {
    const operationDate = parseLocalDate(operation.date);

    if (isSameDay(operationDate, today)) dailyProfit += operation.profitLoss;
    if (operationDate >= weekStart && operationDate <= today) weeklyProfit += operation.profitLoss;
    if (isSameMonth(operationDate, today)) monthlyProfit += operation.profitLoss;
    if (operation.status === 'open') activeOperations += 1;
    totalDeposit += operation.depositAmount;
    totalReturn += operation.totalReturn;
  }

  for (const house of bettingHouses) {
    if (house.status === 'active') activeHouses += 1;
  }

  return {
    dailyProfit,
    weeklyProfit,
    monthlyProfit,
    totalDeposit,
    totalReturn,
    roi: totalDeposit > 0 ? ((totalReturn - totalDeposit) / totalDeposit) * 100 : 0,
    activeHouses,
    activeOperations,
  };
}

function mergeHouseOperationStats(bettingHouses: BettingHouse[], appOperations: Operation[]): BettingHouse[] {
  const statsByHouse = new Map<string, Pick<BettingHouse, 'activeOperations' | 'deposit' | 'returns' | 'profit' | 'roi'>>();

  for (const operation of appOperations) {
    const current = statsByHouse.get(operation.bettingHouseId) ?? {
      activeOperations: 0,
      deposit: 0,
      returns: 0,
      profit: 0,
      roi: 0,
    };

    if (operation.status === 'open') current.activeOperations += 1;
    current.deposit += operation.depositAmount;
    current.returns += operation.totalReturn;
    current.profit += operation.profitLoss;
    current.roi = current.deposit > 0 ? (current.profit / current.deposit) * 100 : 0;
    statsByHouse.set(operation.bettingHouseId, current);
  }

  return bettingHouses.map((house) => ({
    ...house,
    ...(statsByHouse.get(house.id) ?? {
      activeOperations: 0,
      deposit: 0,
      returns: 0,
      profit: 0,
      roi: 0,
    }),
  }));
}

export function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialTheme);
  const [invites, setInvites] = useState<Invite[]>(initialInvites);
  const [users, setUsers] = useState<UserProfile[]>([currentUser, ...initialOperators]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [bettingHouses, setBettingHouses] = useState<BettingHouse[]>(houses);
  const [appOperations, setAppOperations] = useState<Operation[]>(initialOperations);
  const [selectedOperationId, setSelectedOperationId] = useState(initialOperations[0].id);
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [authProfile, setAuthProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(isFirebaseConfigured);
  const [authError, setAuthError] = useState('');
  const [demoMode, setDemoMode] = useState(!isFirebaseConfigured);
  const [hasFirstAdmin, setHasFirstAdmin] = useState<boolean | null>(isFirebaseConfigured ? null : false);

  useEffect(() => {
    setStoredThemeMode(themeMode);
    document.documentElement.dataset.theme = resolveTheme(themeMode);
  }, [themeMode]);

  useEffect(() => {
    if (themeMode !== 'system') return;

    return subscribeToSystemTheme((theme) => {
      document.documentElement.dataset.theme = theme;
    });
  }, [themeMode]);

  useEffect(() => {
    if (!isFirebaseConfigured) return;

    let unsubscribe: (() => void) | undefined;
    let active = true;

    void getBootstrapStatus()
      .then((status) => {
        if (active) setHasFirstAdmin(status.hasFirstAdmin);
      })
      .catch(() => {
        if (active) setHasFirstAdmin(false);
      });

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

    void subscribeOrganizationLists(authProfile.organizationId, setUsers, setInvites, setGoals, setBettingHouses, setAppOperations, setAuditLogs).then((cleanup) => {
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
  const canCreateFirstAdmin = hasFirstAdmin === false || Boolean(authSession && !authProfile);

  useEffect(() => {
    if (!canAccessPage(activeUser.role, page)) {
      setPage('dashboard');
    }
  }, [activeUser.role, page]);

  const operators = useMemo(() => users.filter((user) => user.role === 'operator'), [users]);
  const visibleOperations = useMemo(
    () => (activeUser.role === 'controller' ? appOperations : appOperations.filter((operation) => operation.operatorId === activeUser.id)),
    [activeUser.id, activeUser.role, appOperations],
  );
  const visibleBettingHouses = useMemo(() => mergeHouseOperationStats(bettingHouses, visibleOperations), [bettingHouses, visibleOperations]);
  const metrics = useMemo(() => calculateMetrics(visibleOperations, visibleBettingHouses), [visibleOperations, visibleBettingHouses]);
  const selectedOperation = visibleOperations.find((operation) => operation.id === selectedOperationId) ?? visibleOperations[0];
  const inviteId = useMemo(() => new URLSearchParams(window.location.search).get('invite'), []);
  const isAcceptInviteRoute = window.location.pathname === '/accept-invite';

  function appendLocalAuditLog(log: Omit<AuditLog, 'id' | 'organizationId' | 'actorUserId' | 'actorName' | 'createdAt'>) {
    if (authProfile && !demoMode) return;

    setAuditLogs((current) => [
      {
        id: createLocalId('audit'),
        organizationId: activeUser.organizationId,
        actorUserId: activeUser.id,
        actorName: activeUser.name,
        createdAt: new Date().toISOString(),
        ...log,
      },
      ...current,
    ]);
  }

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
    appendLocalAuditLog({
      entityType: 'invite',
      entityId: invite.id,
      action: 'invite.created',
      summary: `Convite gerado para ${invite.email}`,
      beforeData: null,
      afterData: { email: invite.email, role: invite.role, status: invite.status, expiresAt: invite.expiresAt },
    });
  }

  async function createGoal(input: Pick<Goal, 'title' | 'targetValue' | 'metric' | 'scope' | 'period'>) {
    const currentValueByMetric: Record<Goal['metric'], number> = {
      profit: metrics.monthlyProfit,
      roi: metrics.roi,
      deposit: metrics.totalDeposit,
      return: metrics.totalReturn,
      cycles: visibleOperations.reduce((total, operation) => total + operation.cycles.length, 0),
      operations: visibleOperations.length,
    };
    const goal: Goal = {
      id: createLocalId('goal'),
      title: input.title,
      scope: input.scope,
      metric: input.metric,
      targetValue: input.targetValue,
      currentValue: currentValueByMetric[input.metric],
      period: input.period,
      status: 'active',
    };

    if (authProfile && !demoMode) await createGoalDocument(authProfile, goal);
    setGoals((current) => [goal, ...current]);
    appendLocalAuditLog({
      entityType: 'goal',
      entityId: goal.id,
      action: 'goal.created',
      summary: `Meta criada: ${goal.title}`,
      beforeData: null,
      afterData: { title: goal.title, targetValue: goal.targetValue, metric: goal.metric, period: goal.period },
    });
  }

  async function createHouse(name: string, website: string, notes: string) {
    const house: BettingHouse = {
      id: createLocalId('house'),
      organizationId: activeUser.organizationId,
      name,
      website: website || undefined,
      notes: notes || undefined,
      status: 'active',
      activeOperations: 0,
      deposit: 0,
      returns: 0,
      profit: 0,
      roi: 0,
    };

    if (authProfile && !demoMode) await createBettingHouseDocument(authProfile, house);
    setBettingHouses((current) => [house, ...current]);
    appendLocalAuditLog({
      entityType: 'betting_house',
      entityId: house.id,
      action: 'betting_house.created',
      summary: `Casa cadastrada: ${house.name}`,
      beforeData: null,
      afterData: { name: house.name, website: house.website ?? null, status: house.status },
    });
  }

  async function updateHouse(house: Pick<BettingHouse, 'id' | 'name' | 'website' | 'notes' | 'status'>) {
    const currentHouse = bettingHouses.find((item) => item.id === house.id);
    if (!currentHouse) return;

    if (authProfile && !demoMode) await updateBettingHouseDocument(authProfile, house, currentHouse);
    setBettingHouses((current) => current.map((item) => (item.id === house.id ? { ...item, ...house } : item)));
    appendLocalAuditLog({
      entityType: 'betting_house',
      entityId: house.id,
      action: house.status === 'inactive' ? 'betting_house.deactivated' : 'betting_house.updated',
      summary: `Casa atualizada: ${house.name}`,
      beforeData: { name: currentHouse.name, website: currentHouse.website ?? null, notes: currentHouse.notes ?? null, status: currentHouse.status },
      afterData: { name: house.name, website: house.website ?? null, notes: house.notes ?? null, status: house.status },
    });
  }

  async function updateOperatorStatus(operatorId: string, status: UserProfile['status']) {
    const operator = users.find((user) => user.id === operatorId);
    if (!operator || operator.role !== 'operator') return;

    if (authProfile && !demoMode) await updateOperatorStatusDocument(authProfile, operator, status);
    setUsers((current) => current.map((user) => (user.id === operatorId ? { ...user, status } : user)));
    appendLocalAuditLog({
      entityType: 'user',
      entityId: operatorId,
      action: status === 'inactive' ? 'operator.deactivated' : 'operator.activated',
      summary: `${status === 'inactive' ? 'Operador desativado' : 'Operador ativado'}: ${operator.name}`,
      beforeData: { status: operator.status },
      afterData: { status },
    });
  }

  async function createOperation(date: string, houseId: string, game: string) {
    const house = bettingHouses.find((item) => item.id === houseId) ?? bettingHouses[0];
    if (!house || house.status !== 'active') return;

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
      initialBalance: 0,
      currentBalance: 0,
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
    appendLocalAuditLog({
      entityType: 'operation',
      entityId: operation.id,
      action: 'operation.created',
      summary: `Operacao criada para ${operation.operatorName} na casa ${operation.bettingHouseName}`,
      beforeData: null,
      afterData: { operatorId: operation.operatorId, bettingHouseId: operation.bettingHouseId, game, date, status: operation.status },
    });
  }

  async function updateOperationStatus(operationId: string, status: Operation['status']) {
    const operation = appOperations.find((item) => item.id === operationId);
    if (!operation) return;

    if (authProfile && !demoMode) await updateOperationStatusDocument(authProfile, operation, status);
    setAppOperations((current) => current.map((item) => (item.id === operationId ? { ...item, status } : item)));
    appendLocalAuditLog({
      entityType: 'operation',
      entityId: operationId,
      action: `operation.${status}`,
      summary: `Operacao ${status}: ${operation.bettingHouseName}`,
      beforeData: { status: operation.status },
      afterData: { status },
    });
  }

  async function updateGoalStatus(goalId: string, status: Goal['status']) {
    const goal = goals.find((item) => item.id === goalId);
    if (!goal) return;

    if (authProfile && !demoMode) await updateGoalStatusDocument(authProfile, goal, status);
    setGoals((current) => current.map((item) => (item.id === goalId ? { ...item, status } : item)));
    appendLocalAuditLog({
      entityType: 'goal',
      entityId: goalId,
      action: `goal.${status}`,
      summary: `Meta atualizada: ${goal.title}`,
      beforeData: { status: goal.status },
      afterData: { status },
    });
  }

  async function addCycle(operationId: string, values: Omit<Cycle, 'id' | 'cycleNumber' | 'roi'>, proofFile?: File | null) {
    const operation = appOperations.find((item) => item.id === operationId);
    if (!operation || operation.status !== 'open') return;
    if (!proofFile && !values.proofName) return;
    if (proofFile && (!proofFile.type.startsWith('image/') || proofFile.size > 10 * 1024 * 1024)) return;

    const result = values.withdrawal + values.bonus - values.deposit;
    const cycle: Cycle = {
      id: createLocalId('cycle'),
      cycleNumber: operation.cycles.length + 1,
      deposit: values.deposit,
      withdrawal: values.withdrawal,
      bonus: values.bonus,
      result,
      roi: values.deposit > 0 ? (result / values.deposit) * 100 : 0,
      status: 'under_review',
      proofName: proofFile?.name ?? values.proofName,
    };

    if (authProfile && !demoMode) await createCycleDocument(authProfile, operation, cycle, proofFile);
    appendLocalAuditLog({
      entityType: 'cycle',
      entityId: cycle.id,
      action: 'cycle.created',
      summary: `Ciclo #${cycle.cycleNumber} registrado em ${operation.bettingHouseName}`,
      beforeData: null,
      afterData: {
        operationId: operation.id,
        deposit: cycle.deposit,
        withdrawal: cycle.withdrawal,
        bonus: cycle.bonus,
        result: cycle.result,
        proofName: cycle.proofName ?? null,
        proofUploaded: Boolean(proofFile),
      },
    });

    setAppOperations((current) =>
      current.map((item) => {
        if (item.id !== operationId) return item;

        const depositAmount = item.depositAmount + cycle.deposit;
        const withdrawalAmount = item.withdrawalAmount + cycle.withdrawal;
        const totalReturn = item.totalReturn + cycle.withdrawal + cycle.bonus;
        const profitLoss = item.profitLoss + cycle.result;
        const currentBalance = item.initialBalance + profitLoss;

        return {
          ...item,
          depositAmount,
          withdrawalAmount,
          totalReturn,
          profitLoss,
          currentBalance,
          roi: depositAmount > 0 ? (profitLoss / depositAmount) * 100 : 0,
          proofCount: item.proofCount + (proofFile ? 1 : 0),
          cycles: [...item.cycles, cycle],
        };
      }),
    );
  }

  async function login() {
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
      setAuthError(error instanceof Error ? error.message : 'Não foi possível entrar.');
      setAuthLoading(false);
    }
  }

  async function createFirstAdmin(organizationName: string) {
    setAuthLoading(true);
    setAuthError('');

    try {
      const profile = await createFirstAdminProfile({ organizationName, themeMode });
      setAuthSession({ uid: profile.id, email: profile.email });
      setAuthProfile(profile);
      setHasFirstAdmin(true);
      setDemoMode(false);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Não foi possível criar o admin.');
    } finally {
      setAuthLoading(false);
    }
  }

  async function acceptInvite(inviteIdValue: string) {
    if (!isFirebaseConfigured) {
      setAuthError('Configure o Firebase para aceitar convites reais.');
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    try {
      const profile = await acceptInviteWithGoogle({ inviteId: inviteIdValue });
      window.history.replaceState({}, '', '/');
      setAuthSession({ uid: profile.id, email: profile.email });
      setAuthProfile(profile);
      setDemoMode(false);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Nao foi possivel aceitar o convite.');
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
        hasFirstAdmin={!canCreateFirstAdmin}
        onLogin={login}
        onCreateFirstAdmin={createFirstAdmin}
        onDemo={() => {
          setAuthError('');
          setDemoMode(true);
        }}
      />
    );
  }

  const pages: Record<Page, ReactNode> = {
    dashboard: <DashboardPage metrics={metrics} bettingHouses={visibleBettingHouses} />,
    operations: (
      <OperationsPage
        bettingHouses={visibleBettingHouses}
        operations={visibleOperations}
        selectedOperation={selectedOperation}
        setSelectedOperationId={setSelectedOperationId}
        onCreateOperation={createOperation}
        onAddCycle={addCycle}
        onUpdateOperationStatus={updateOperationStatus}
      />
    ),
    houses: <HousesPage bettingHouses={visibleBettingHouses} onCreateHouse={createHouse} onUpdateHouse={updateHouse} />,
    operators: <OperatorsPage invites={invites} operators={operators} operations={appOperations} onInvite={createInvite} onUpdateOperatorStatus={updateOperatorStatus} />,
    goals: <GoalsPage goals={goals} onCreateGoal={createGoal} onUpdateGoalStatus={updateGoalStatus} />,
    reports: <ReportsPage metrics={metrics} bettingHouses={visibleBettingHouses} operations={visibleOperations} />,
    settings: <SettingsPage themeMode={themeMode} setThemeMode={setThemeMode} />,
    audit: activeUser.role === 'controller' ? <AuditPage auditLogs={auditLogs} /> : <DashboardPage metrics={metrics} bettingHouses={visibleBettingHouses} />,
  };

  return (
    <AppShell
      activeUser={activeUser}
      auditLogs={auditLogs}
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
