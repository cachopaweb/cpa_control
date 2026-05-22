import { useMemo, useState } from 'react';
import { ClipboardList, Search } from 'lucide-react';
import type { AuditLog } from '../../data/types';
import { Panel } from '../../shared/components/Panel';

const entityLabels: Record<AuditLog['entityType'], string> = {
  invite: 'Convite',
  betting_house: 'Casa',
  operation: 'Operação',
  cycle: 'Ciclo',
  proof: 'Comprovante',
  goal: 'Meta',
  user: 'Usuário',
};

function dateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function AuditPage({ auditLogs }: { auditLogs: AuditLog[] }) {
  const [query, setQuery] = useState('');
  const [entityType, setEntityType] = useState('all');
  const [actor, setActor] = useState('all');
  const actors = useMemo(() => Array.from(new Set(auditLogs.map((log) => log.actorName))).sort(), [auditLogs]);
  const filteredLogs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return auditLogs.filter((log) => {
      const matchesQuery =
        !normalizedQuery ||
        log.summary.toLowerCase().includes(normalizedQuery) ||
        log.action.toLowerCase().includes(normalizedQuery) ||
        log.entityId.toLowerCase().includes(normalizedQuery) ||
        dateTime(log.createdAt).toLowerCase().includes(normalizedQuery);
      const matchesEntity = entityType === 'all' || log.entityType === entityType;
      const matchesActor = actor === 'all' || log.actorName === actor;

      return matchesQuery && matchesEntity && matchesActor;
    });
  }, [actor, auditLogs, entityType, query]);

  return (
    <section className="page-grid">
      <Panel title="Trilha de auditoria" subtitle="Eventos sensíveis registrados por organização" className="wide-panel">
        <div className="toolbar">
          <label className="search-field">
            <Search size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por ação, entidade ou data" />
          </label>
          <label className="select-field audit-filter">
            <ClipboardList size={16} />
            <select value={entityType} onChange={(event) => setEntityType(event.target.value)}>
              <option value="all">Todas entidades</option>
              {Object.entries(entityLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="select-field audit-filter">
            <select value={actor} onChange={(event) => setActor(event.target.value)}>
              <option value="all">Todos usuários</option>
              {actors.map((actorName) => (
                <option key={actorName} value={actorName}>
                  {actorName}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="audit-list">
          {filteredLogs.length === 0 ? (
            <div className="empty-state compact">
              <strong>Nenhum evento encontrado</strong>
              <span>Ajuste os filtros para revisar outros registros da organização.</span>
            </div>
          ) : null}
          {filteredLogs.map((log) => (
            <article className="audit-row" key={log.id}>
              <div className="audit-icon">
                <ClipboardList size={16} />
              </div>
              <div className="audit-main">
                <div>
                  <strong>{log.summary}</strong>
                  <span>
                    {entityLabels[log.entityType]} - {log.action} - {log.entityId}
                  </span>
                </div>
                <small>
                  {log.actorName} - {dateTime(log.createdAt)}
                </small>
              </div>
            </article>
          ))}
        </div>
      </Panel>
    </section>
  );
}
