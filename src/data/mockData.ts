import type { BettingHouse, Goal, Invite, Operation, UserProfile } from './types';

export const currentUser: UserProfile = {
  id: 'user-controller-1',
  organizationId: 'org-cpa-demo',
  name: 'Rodrigo Moreira Ribeiro',
  email: 'admin@cpacontrol.com',
  role: 'controller',
  status: 'active',
};

export const operators: UserProfile[] = [
  { id: 'op-1', organizationId: 'org-cpa-demo', name: 'Lucas', email: 'lucas@demo.com', role: 'operator', status: 'active' },
  { id: 'op-2', organizationId: 'org-cpa-demo', name: 'Vitor Henrique', email: 'vitor@demo.com', role: 'operator', status: 'active' },
  { id: 'op-3', organizationId: 'org-cpa-demo', name: 'Rafael Ferraz', email: 'rafael@demo.com', role: 'operator', status: 'active' },
  { id: 'op-4', organizationId: 'org-cpa-demo', name: 'Warley Henrique', email: 'warley@demo.com', role: 'operator', status: 'inactive' },
];

export const houses: BettingHouse[] = [
  { id: 'w1', organizationId: 'org-cpa-demo', name: 'W1', website: 'https://w1.example', status: 'active', activeOperations: 185, deposit: 62800, returns: 84703, profit: 21903, roi: 34.9 },
  { id: 'operadores', organizationId: 'org-cpa-demo', name: 'OPERADORES', status: 'active', activeOperations: 15, deposit: 45800, returns: 65935, profit: 20135, roi: 43.9 },
  { id: '91', organizationId: 'org-cpa-demo', name: '91', status: 'active', activeOperations: 201, deposit: 54400, returns: 70365, profit: 15965, roi: 29.3 },
  { id: 'we', organizationId: 'org-cpa-demo', name: 'WE', status: 'inactive', activeOperations: 196, deposit: 41000, returns: 53848, profit: 12848, roi: 31.3 },
  { id: 'voy1', organizationId: 'org-cpa-demo', name: 'VOY1', status: 'active', activeOperations: 107, deposit: 28300, returns: 39111, profit: 10811, roi: 38.2 },
];

export const operations: Operation[] = [
  {
    id: 'operation-1',
    organizationId: 'org-cpa-demo',
    operatorId: 'op-1',
    operatorName: 'Lucas',
    bettingHouseId: 'w1',
    bettingHouseName: 'W1',
    game: 'Aviator',
    date: '2026-05-21',
    status: 'open',
    depositAmount: 1650,
    withdrawalAmount: 2620,
    totalReturn: 3180,
    profitLoss: 1530,
    roi: 92.7,
    proofCount: 3,
    cycles: [
      { id: 'c1', cycleNumber: 1, deposit: 500, withdrawal: 820, bonus: 80, result: 400, roi: 80, proofName: 'print-ciclo-1.png' },
      { id: 'c2', cycleNumber: 2, deposit: 650, withdrawal: 940, bonus: 120, result: 410, roi: 63.1, proofName: 'print-ciclo-2.png' },
      { id: 'c3', cycleNumber: 3, deposit: 500, withdrawal: 860, bonus: 90, result: 450, roi: 90, proofName: 'print-ciclo-3.png' },
    ],
  },
  {
    id: 'operation-2',
    organizationId: 'org-cpa-demo',
    operatorId: 'op-2',
    operatorName: 'Vitor Henrique',
    bettingHouseId: '91',
    bettingHouseName: '91',
    game: 'Mines',
    date: '2026-05-20',
    status: 'closed',
    depositAmount: 2800,
    withdrawalAmount: 3900,
    totalReturn: 3900,
    profitLoss: 1100,
    roi: 39.3,
    proofCount: 4,
    cycles: [
      { id: 'c4', cycleNumber: 1, deposit: 900, withdrawal: 1200, bonus: 0, result: 300, roi: 33.3, proofName: 'mines-1.png' },
      { id: 'c5', cycleNumber: 2, deposit: 950, withdrawal: 1300, bonus: 0, result: 350, roi: 36.8, proofName: 'mines-2.png' },
      { id: 'c6', cycleNumber: 3, deposit: 950, withdrawal: 1400, bonus: 0, result: 450, roi: 47.4, proofName: 'mines-3.png' },
    ],
  },
  {
    id: 'operation-3',
    organizationId: 'org-cpa-demo',
    operatorId: 'op-3',
    operatorName: 'Rafael Ferraz',
    bettingHouseId: 'operadores',
    bettingHouseName: 'OPERADORES',
    game: 'Aviator',
    date: '2026-05-21',
    status: 'open',
    depositAmount: 1200,
    withdrawalAmount: 1710,
    totalReturn: 1710,
    profitLoss: 510,
    roi: 42.5,
    proofCount: 2,
    cycles: [
      { id: 'c7', cycleNumber: 1, deposit: 600, withdrawal: 840, bonus: 0, result: 240, roi: 40, proofName: 'rafael-1.png' },
      { id: 'c8', cycleNumber: 2, deposit: 600, withdrawal: 870, bonus: 0, result: 270, roi: 45, proofName: 'rafael-2.png' },
    ],
  },
];

export const goals: Goal[] = [
  { id: 'goal-1', title: 'Lucro mensal da organização', scope: 'organization', metric: 'profit', targetValue: 60000, currentValue: 46303, period: 'Maio/2026' },
  { id: 'goal-2', title: 'ROI médio por depósito', scope: 'organization', metric: 'roi', targetValue: 35, currentValue: 31.8, period: 'Maio/2026' },
  { id: 'goal-3', title: 'Retorno da casa W1', scope: 'betting_house', metric: 'return', targetValue: 90000, currentValue: 84703, period: 'Maio/2026' },
];

export const invites: Invite[] = [
  { id: 'invite-1', email: 'novo.operador@demo.com', role: 'operator', status: 'pending', link: 'https://app.cpa.local/accept-invite?token=demo-token', expiresAt: '2026-05-28' },
];
