import { useState, type FormEvent } from 'react';
import { Flag } from 'lucide-react';
import type { Goal } from '../../data/types';
import { Panel } from '../../shared/components/Panel';
import { currency, percent } from '../../utils/format';

export function GoalsPage({ goals, onCreateGoal }: { goals: Goal[]; onCreateGoal: (title: string, targetValue: number) => void | Promise<void> }) {
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('60000');

  return (
    <section className="two-column">
      <Panel title="Metas com progresso" subtitle="Organização, operadores e casas">
        <div className="goal-list">
          {goals.map((goal) => {
            const progress = Math.min((goal.currentValue / goal.targetValue) * 100, 100);
            return (
              <article className="goal-card" key={goal.id}>
                <div>
                  <strong>{goal.title}</strong>
                  <span>{goal.period} · {goal.metric.toUpperCase()}</span>
                </div>
                <b>{progress.toFixed(0)}%</b>
                <div className="progress-track">
                  <i style={{ width: `${progress}%` }} />
                </div>
                <small>{currency(goal.currentValue)} de {goal.metric === 'roi' ? percent(goal.targetValue) : currency(goal.targetValue)}</small>
              </article>
            );
          })}
        </div>
      </Panel>

      <Panel title="Nova meta" subtitle="MVP focado em lucro mensal">
        <form
          className="invite-form"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            void onCreateGoal(title || 'Nova meta de lucro', Number(target));
            setTitle('');
          }}
        >
          <label>
            Título
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Meta de lucro da equipe" />
          </label>
          <label>
            Valor alvo
            <input value={target} onChange={(event) => setTarget(event.target.value)} type="number" />
          </label>
          <button className="primary-button" type="submit">
            <Flag size={16} />
            Criar meta
          </button>
        </form>
      </Panel>
    </section>
  );
}
