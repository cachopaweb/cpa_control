import { useState, type FormEvent } from 'react';
import { Copy, Link2 } from 'lucide-react';
import type { Invite } from '../../data/types';
import { operators } from '../../data/mockData';
import { MetricCard } from '../../shared/components/MetricCard';
import { Panel } from '../../shared/components/Panel';
import { currency, shortDate } from '../../utils/format';

export function OperatorsPage({ invites, onInvite }: { invites: Invite[]; onInvite: (email: string) => void | Promise<void> }) {
  const [email, setEmail] = useState('');
  const ranked = operators.map((operator, index) => ({
    ...operator,
    profit: [3147, 2616, 2417, 2389][index],
    deposits: [403, 700, 365, 355][index],
  }));

  return (
    <section className="two-column">
      <Panel title="Ranking de operadores" subtitle="Performance, equipe e status">
        <div className="stats-grid mini">
          <MetricCard label="Operadores" value={String(operators.length)} />
          <MetricCard label="Ativos" value={String(operators.filter((operator) => operator.status === 'active').length)} />
          <MetricCard label="Lucro equipe" value={currency(32599)} positive />
        </div>
        <div className="operator-list">
          {ranked.map((operator, index) => (
            <div className="operator-row" key={operator.id}>
              <span className="rank-badge">{index + 1}</span>
              <div className="operator-avatar">{operator.name[0]}</div>
              <div className="operator-main">
                <strong>{operator.name}</strong>
                <span>{operator.deposits} deps · {operator.status === 'active' ? 'ativo' : 'inativo'}</span>
                <div className="progress-track">
                  <i style={{ width: `${82 - index * 8}%` }} />
                </div>
              </div>
              <b>{currency(operator.profit)}</b>
            </div>
          ))}
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
                <span>Expira em {shortDate(invite.expiresAt)}</span>
              </div>
              <button className="ghost-button" onClick={() => navigator.clipboard?.writeText(invite.link)}>
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
