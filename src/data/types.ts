export type Role = 'controller' | 'operator';
export type Status = 'active' | 'inactive';
export type ThemeMode = 'system' | 'light' | 'dark';

export type UserProfile = {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  role: Role;
  status: Status;
};

export type BettingHouse = {
  id: string;
  organizationId: string;
  name: string;
  website?: string;
  notes?: string;
  status: Status;
  activeOperations: number;
  deposit: number;
  returns: number;
  profit: number;
  roi: number;
};

export type Operation = {
  id: string;
  organizationId: string;
  operatorId: string;
  operatorName: string;
  bettingHouseId: string;
  bettingHouseName: string;
  game: string;
  date: string;
  status: 'open' | 'paused' | 'closed';
  initialBalance: number;
  currentBalance: number;
  depositAmount: number;
  withdrawalAmount: number;
  totalReturn: number;
  profitLoss: number;
  roi: number;
  proofCount: number;
  cycles: Cycle[];
};

export type Cycle = {
  id: string;
  cycleNumber: number;
  deposit: number;
  withdrawal: number;
  bonus: number;
  result: number;
  roi: number;
  status: 'pending' | 'under_review' | 'won' | 'lost' | 'canceled';
  proofName?: string;
  proofUrl?: string;
};

export type Goal = {
  id: string;
  title: string;
  scope: 'organization' | 'operator' | 'betting_house';
  metric: 'profit' | 'roi' | 'deposit' | 'return' | 'cycles' | 'operations';
  targetValue: number;
  currentValue: number;
  period: string;
  status: 'active' | 'completed' | 'missed' | 'canceled';
};

export type Invite = {
  id: string;
  email: string;
  role: Role;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  link: string;
  expiresAt: string;
};

export type DashboardMetrics = {
  dailyProfit: number;
  weeklyProfit: number;
  monthlyProfit: number;
  totalDeposit: number;
  totalReturn: number;
  roi: number;
  activeHouses: number;
  activeOperations: number;
};

export type AuditEntityType = 'invite' | 'betting_house' | 'operation' | 'cycle' | 'proof' | 'goal' | 'user';

export type AuditLog = {
  id: string;
  organizationId: string;
  actorUserId: string;
  actorName: string;
  entityType: AuditEntityType;
  entityId: string;
  action: string;
  summary: string;
  createdAt: string;
  beforeData?: Record<string, unknown> | null;
  afterData?: Record<string, unknown> | null;
};
