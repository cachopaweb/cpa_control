import { useMemo, useState, type FormEvent } from 'react';
import { Copy, Link2, Search, UserCheck, UserX } from 'lucide-react';
import type { Invite, Operation, UserProfile } from '../../data/types';
import { MetricCard } from '../../shared/components/MetricCard';
import { Panel } from '../../shared/components/Panel';
import { currency, shortDate } from '../../utils/format';

export function OperatorsPage({
  invites,
  operators,
  operations,
  onInvite,
  onUpdateOperatorStatus,
}: {
  invites: Invite[];
  operators: UserProfile[];
  operations: Operation[];
  onInvite: (email: string) => void | Promise<void>;
  onUpdateOperatorStatus: (operatorId: string, status: UserProfile['status']) => void | Promise<void>;
}) {
  const [email, setEmail] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | UserProfile['status']>('all');
  const summaries = useMemo(() => {
    const summaryByOperator = new Map<string, { profit: number; deposits: number; cycles: number; open: number }>();

    for (const operation of operations) {
      const current = summaryByOperator.get(operation.operatorId) ?? { profit: 0, deposits: 0, cycles: 0, open: 0 };
      current.profit += operation.profitLoss;
      current.deposits += operation.depositAmount;
      current.cycles += operation.cycles.length;
      if (operation.status === 'open') current.open += 1;
      summaryByOperator.set(operation.operatorId, current);
    }

    return summaryByOperator;
  }, [operations]);
  const filteredOperators = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return operators
      .filter((operator) => statusFilter === 'all' || operator.status === statusFilter)
      .filter((operator) => !normalizedQuery || operator.name.toLowerCase().includes(normalizedQuery) || operator.email.toLowerCase().includes(normalizedQuery))
      .toSorted((a, b) => (summaries.get(b.id)?.profit ?? 0) - (summaries.get(a.id)?.profit ?? 0));
  }, [operators, query, statusFilter, summaries]);

  return (
    <section className="two-column">
      <Panel title="Ranking de operadores" subtitle="Performance, equipe e status">
        <div className="stats-grid mini">
          <MetricCard label="Operadores" value={String(operators.length)} />
          <MetricCard label="Ativos" value={String(operators.filter((operator) => operator.status === 'active').length)} />
          <MetricCard label="Lucro equipe" value={currency(Array.from(summaries.values()).reduce((total, item) => total + item.profit, 0))} positive />
          <MetricCard label="Ciclos" value={String(Array.from(summaries.values()).reduce((total, item) => total + item.cycles, 0))} />
        </div>

        <div className="toolbar">
          <label className="search-field">
            <Search size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar operador" />
          </label>
          <label className="select-field compact-select">
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
              <option value="all">Todos</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
            </select>
          </label>
        </div>

        <div className="operator-list">
          {filteredOperators.map((operator, index) => {
            const summary = summaries.get(operator.id) ?? { profit: 0, deposits: 0, cycles: 0, open: 0 };

            return (
              <div className="operator-row" key={operator.id}>
                <span className="rank-badge">{index + 1}</span>
                <div className="operator-avatar">{operator.name[0]}</div>
                <div className="operator-main">
                  <strong>{operator.name}</strong>
                  <span>
                    {summary.open} abertas · {summary.cycles} ciclos · {operator.status === 'active' ? 'ativo' : 'inativo'}
                  </span>
                  <div className="progress-track">
                    <i style={{ width: `${Math.min(Math.abs(summary.profit) / 80, 100)}%` }} />
                  </div>
                </div>
                <b>{currency(summary.profit)}</b>
                <button
                  className="ghost-button row-action"
                  onClick={() => void onUpdateOperatorStatus(operator.id, operator.status === 'active' ? 'inactive' : 'active')}
                  type="button"
                >
                  {operator.status === 'active' ? <UserX size={15} /> : <UserCheck size={15} />}
                  {operator.status === 'active' ? 'Desativar' : 'Ativar'}
                </button>
              </div>
            );
          })}
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
                <span>
                  {invite.status} · expira em {shortDate(invite.expiresAt)}
                </span>
              </div>
              <button className="ghost-button" onClick={() => navigator.clipboard?.writeText(invite.link)} type="button">
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
