import { useMemo, useState, type FormEvent } from 'react';
import { CheckCircle2, Flag, XCircle } from 'lucide-react';
import type { Goal } from '../../data/types';
import { Panel } from '../../shared/components/Panel';
import { currency, percent } from '../../utils/format';

function formatGoalValue(goal: Pick<Goal, 'metric' | 'targetValue'>, value: number) {
  if (goal.metric === 'roi') return percent(value);
  if (goal.metric === 'cycles' || goal.metric === 'operations') return String(Math.round(value));
  return currency(value);
}

export function GoalsPage({
  goals,
  onCreateGoal,
  onUpdateGoalStatus,
}: {
  goals: Goal[];
  onCreateGoal: (goal: Pick<Goal, 'title' | 'targetValue' | 'metric' | 'scope' | 'period'>) => void | Promise<void>;
  onUpdateGoalStatus: (goalId: string, status: Goal['status']) => void | Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('60000');
  const [metric, setMetric] = useState<Goal['metric']>('profit');
  const [scope, setScope] = useState<Goal['scope']>('organization');
  const [period, setPeriod] = useState('Maio/2026');
  const orderedGoals = useMemo(() => goals.toSorted((a, b) => Number(b.status === 'active') - Number(a.status === 'active')), [goals]);

  return (
    <section className="two-column">
      <Panel title="Metas com progresso" subtitle="Organização, operadores e casas">
        <div className="goal-list">
          {orderedGoals.map((goal) => {
            const progress = goal.targetValue > 0 ? Math.min((goal.currentValue / goal.targetValue) * 100, 100) : 0;
            return (
              <article className="goal-card" key={goal.id}>
                <div>
                  <strong>{goal.title}</strong>
                  <span>
                    {goal.period} · {goal.metric.toUpperCase()} · {goal.status}
                  </span>
                </div>
                <b>{progress.toFixed(0)}%</b>
                <div className="progress-track">
                  <i style={{ width: `${progress}%` }} />
                </div>
                <small>
                  {formatGoalValue(goal, goal.currentValue)} de {formatGoalValue(goal, goal.targetValue)}
                </small>
                <div className="card-actions">
                  <button className="ghost-button" type="button" onClick={() => void onUpdateGoalStatus(goal.id, 'completed')} disabled={goal.status === 'completed'}>
                    <CheckCircle2 size={15} />
                    Concluir
                  </button>
                  <button className="ghost-button" type="button" onClick={() => void onUpdateGoalStatus(goal.id, 'canceled')} disabled={goal.status === 'canceled'}>
                    <XCircle size={15} />
                    Cancelar
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </Panel>

      <Panel title="Nova meta" subtitle="Lucro, ROI, depósito, retorno, ciclos ou operações">
        <form
          className="invite-form"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            void onCreateGoal({
              title: title || 'Nova meta',
              targetValue: Number(target),
              metric,
              scope,
              period,
            });
            setTitle('');
          }}
        >
          <label>
            Título
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Meta de lucro da equipe" />
          </label>
          <label>
            Métrica
            <select value={metric} onChange={(event) => setMetric(event.target.value as Goal['metric'])}>
              <option value="profit">Lucro</option>
              <option value="roi">ROI</option>
              <option value="deposit">Depósito</option>
              <option value="return">Retorno</option>
              <option value="cycles">Ciclos</option>
              <option value="operations">Operações</option>
            </select>
          </label>
          <label>
            Escopo
            <select value={scope} onChange={(event) => setScope(event.target.value as Goal['scope'])}>
              <option value="organization">Organização</option>
              <option value="operator">Operador</option>
              <option value="betting_house">Casa</option>
            </select>
          </label>
          <label>
            Período
            <input value={period} onChange={(event) => setPeriod(event.target.value)} />
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
