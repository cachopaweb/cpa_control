import { Building2, CalendarDays, ClipboardList, FileImage, Gauge, TrendingUp } from 'lucide-react';
import type { BettingHouse, DashboardMetrics } from '../../data/types';
import { MetricCard } from '../../shared/components/MetricCard';
import { Panel } from '../../shared/components/Panel';
import { currency, percent } from '../../utils/format';

export function DashboardPage({ metrics, bettingHouses }: { metrics: DashboardMetrics; bettingHouses: BettingHouse[] }) {
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
