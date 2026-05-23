import type { ReactNode } from 'react';
import { BarChart3, Building2, CalendarDays, ClipboardList, LayoutDashboard, Settings, Target, Users } from 'lucide-react';
import type { Role } from '../data/types';

export type Page = 'dashboard' | 'operations' | 'houses' | 'operators' | 'goals' | 'reports' | 'audit' | 'settings';

export const navItems: Array<{ page: Page; label: string; icon: ReactNode }> = [
  { page: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { page: 'operations', label: 'Operações', icon: <CalendarDays size={18} /> },
  { page: 'houses', label: 'Casas', icon: <Building2 size={18} /> },
  { page: 'operators', label: 'Operadores', icon: <Users size={18} /> },
  { page: 'goals', label: 'Metas', icon: <Target size={18} /> },
  { page: 'reports', label: 'Relatórios', icon: <BarChart3 size={18} /> },
  { page: 'audit', label: 'Auditoria', icon: <ClipboardList size={18} /> },
  { page: 'settings', label: 'Configurações', icon: <Settings size={18} /> },
];

const operatorPages = new Set<Page>(['dashboard', 'operations', 'houses', 'reports', 'settings']);

export function canAccessPage(role: Role, page: Page) {
  return role === 'controller' || operatorPages.has(page);
}

export function getNavItemsForRole(role: Role) {
  return navItems.filter((item) => canAccessPage(role, item.page));
}

export const pageTitles: Record<Page, string> = {
  dashboard: 'Dashboard',
  operations: 'Operações',
  houses: 'Casas de apostas',
  operators: 'Operadores',
  goals: 'Metas',
  reports: 'Relatórios',
  audit: 'Logs de auditoria',
  settings: 'Configurações',
};

export const pageDescriptions: Record<Page, string> = {
  dashboard: 'Visao geral das operacoes CPA',
  operations: 'Criacao, acompanhamento e ciclos com comprovante',
  houses: 'Cadastro, status e desempenho por casa',
  operators: 'Equipe, convites e performance operacional',
  goals: 'Progresso financeiro e metas por periodo',
  reports: 'ROI, depositos e retorno consolidado',
  audit: 'Eventos sensiveis e historico append-only',
  settings: 'Preferencias do usuario e ambiente',
};
