import type { ReactNode } from 'react';

export function MetricCard({
  label,
  value,
  hint,
  icon,
  positive,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  positive?: boolean;
  tone?: 'danger';
}) {
  return (
    <article className="metric-card">
      <div>
        <span>{label}</span>
        <strong className={tone === 'danger' ? 'danger-text' : positive ? 'success-text' : undefined}>{value}</strong>
        {hint && <small>{hint}</small>}
      </div>
      {icon && <div className="metric-icon">{icon}</div>}
    </article>
  );
}
