import { useMemo, useState } from 'react';
import { Download, Filter } from 'lucide-react';
import type { BettingHouse, DashboardMetrics, Operation } from '../../data/types';
import { MetricCard } from '../../shared/components/MetricCard';
import { Panel } from '../../shared/components/Panel';
import { currency, percent } from '../../utils/format';

function toCsv(rows: string[][]) {
  return rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n');
}

export function ReportsPage({ metrics, bettingHouses, operations }: { metrics: DashboardMetrics; bettingHouses: BettingHouse[]; operations: Operation[] }) {
  const [houseId, setHouseId] = useState('all');
  const [status, setStatus] = useState<'all' | Operation['status']>('all');
  const filteredOperations = useMemo(
    () => operations.filter((operation) => (houseId === 'all' || operation.bettingHouseId === houseId) && (status === 'all' || operation.status === status)),
    [houseId, operations, status],
  );
  const filteredMetrics = useMemo(() => {
    const totalDeposit = filteredOperations.reduce((total, operation) => total + operation.depositAmount, 0);
    const totalReturn = filteredOperations.reduce((total, operation) => total + operation.totalReturn, 0);
    const profit = filteredOperations.reduce((total, operation) => total + operation.profitLoss, 0);

    return {
      totalDeposit,
      totalReturn,
      profit,
      roi: totalDeposit > 0 ? (profit / totalDeposit) * 100 : 0,
      cycles: filteredOperations.reduce((total, operation) => total + operation.cycles.length, 0),
    };
  }, [filteredOperations]);
  const reportRows = useMemo(() => {
    const rowsByHouse = new Map<string, { name: string; deposit: number; returns: number; profit: number; operations: number }>();

    for (const operation of filteredOperations) {
      const current = rowsByHouse.get(operation.bettingHouseId) ?? {
        name: operation.bettingHouseName,
        deposit: 0,
        returns: 0,
        profit: 0,
        operations: 0,
      };
      current.deposit += operation.depositAmount;
      current.returns += operation.totalReturn;
      current.profit += operation.profitLoss;
      current.operations += 1;
      rowsByHouse.set(operation.bettingHouseId, current);
    }

    return Array.from(rowsByHouse.values()).toSorted((a, b) => b.profit - a.profit);
  }, [filteredOperations]);

  function exportCsv() {
    const csv = toCsv([
      ['Casa', 'Operacoes', 'Deposito', 'Retorno', 'Lucro', 'ROI'],
      ...reportRows.map((row) => [
        row.name,
        String(row.operations),
        String(row.deposit),
        String(row.returns),
        String(row.profit),
        row.deposit > 0 ? String((row.profit / row.deposit) * 100) : '0',
      ]),
    ]);
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'relatorio-cpa.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="page-grid">
      <div className="stats-grid wide">
        <MetricCard label="Lucro diário" value={currency(metrics.dailyProfit)} positive />
        <MetricCard label="Lucro mensal" value={currency(metrics.monthlyProfit)} positive />
        <MetricCard label="Depósito filtrado" value={currency(filteredMetrics.totalDeposit)} />
        <MetricCard label="Retorno filtrado" value={currency(filteredMetrics.totalReturn)} positive />
        <MetricCard label="ROI filtrado" value={percent(filteredMetrics.roi)} positive />
        <MetricCard label="Ciclos filtrados" value={String(filteredMetrics.cycles)} />
      </div>
      <Panel title="Relatório por casa" subtitle="ROI, depósito, retorno e lucro" className="wide-panel report-panel">
        <div className="toolbar">
          <label className="select-field compact-select">
            <Filter size={16} />
            <select value={houseId} onChange={(event) => setHouseId(event.target.value)}>
              <option value="all">Todas as casas</option>
              {bettingHouses.map((house) => (
                <option key={house.id} value={house.id}>
                  {house.name}
                </option>
              ))}
            </select>
          </label>
          <label className="select-field compact-select">
            <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
              <option value="all">Todos status</option>
              <option value="open">Abertas</option>
              <option value="paused">Pausadas</option>
              <option value="closed">Encerradas</option>
            </select>
          </label>
          <button className="ghost-button" type="button" onClick={exportCsv}>
            <Download size={16} />
            Exportar CSV
          </button>
        </div>

        <div className="table">
          <div className="table-row table-head">
            <span>Casa</span>
            <span>Operações</span>
            <span>Depósito</span>
            <span>Retorno</span>
            <span>Lucro</span>
            <span>ROI</span>
          </div>
          {reportRows.map((row) => (
            <div className="table-row" key={row.name}>
              <strong>{row.name}</strong>
              <span>{row.operations}</span>
              <span>{currency(row.deposit)}</span>
              <span>{currency(row.returns)}</span>
              <strong>{currency(row.profit)}</strong>
              <span>{percent(row.deposit > 0 ? (row.profit / row.deposit) * 100 : 0)}</span>
            </div>
          ))}
        </div>
      </Panel>
    </section>
  );
}
