import type { BettingHouse, DashboardMetrics } from '../../data/types';
import { MetricCard } from '../../shared/components/MetricCard';
import { Panel } from '../../shared/components/Panel';
import { currency, percent } from '../../utils/format';

export function ReportsPage({ metrics, bettingHouses }: { metrics: DashboardMetrics; bettingHouses: BettingHouse[] }) {
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
          {bettingHouses.map((house) => (
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
