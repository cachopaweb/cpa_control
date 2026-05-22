import type { ReactNode } from 'react';
import { BarChart3, Building2, CalendarDays, LayoutDashboard, Settings, Target, Users } from 'lucide-react';

export type Page = 'dashboard' | 'operations' | 'houses' | 'operators' | 'goals' | 'reports' | 'settings';

export const navItems: Array<{ page: Page; label: string; icon: ReactNode }> = [
  { page: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { page: 'operations', label: 'Operações', icon: <CalendarDays size={18} /> },
  { page: 'houses', label: 'Casas', icon: <Building2 size={18} /> },
  { page: 'operators', label: 'Operadores', icon: <Users size={18} /> },
  { page: 'goals', label: 'Metas', icon: <Target size={18} /> },
  { page: 'reports', label: 'Relatórios', icon: <BarChart3 size={18} /> },
  { page: 'settings', label: 'Configurações', icon: <Settings size={18} /> },
];

export const pageTitles: Record<Page, string> = {
  dashboard: 'Dashboard',
  operations: 'Operações',
  houses: 'Casas de apostas',
  operators: 'Operadores',
  goals: 'Metas',
  reports: 'Relatórios',
  settings: 'Configurações',
};
