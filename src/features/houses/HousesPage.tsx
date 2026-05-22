import { useMemo, useState, type FormEvent } from 'react';
import { Building2, CheckCircle2, Pencil, Plus, Search, XCircle } from 'lucide-react';
import type { BettingHouse } from '../../data/types';
import { Panel } from '../../shared/components/Panel';
import { currency, percent } from '../../utils/format';

export function HousesPage({
  bettingHouses,
  onCreateHouse,
  onUpdateHouse,
}: {
  bettingHouses: BettingHouse[];
  onCreateHouse: (name: string, website: string, notes: string) => void | Promise<void>;
  onUpdateHouse: (house: Pick<BettingHouse, 'id' | 'name' | 'website' | 'notes' | 'status'>) => void | Promise<void>;
}) {
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [notes, setNotes] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | BettingHouse['status']>('all');
  const [editingId, setEditingId] = useState('');
  const editingHouse = bettingHouses.find((house) => house.id === editingId);
  const filteredHouses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return bettingHouses
      .filter((house) => statusFilter === 'all' || house.status === statusFilter)
      .filter((house) => !normalizedQuery || house.name.toLowerCase().includes(normalizedQuery) || house.website?.toLowerCase().includes(normalizedQuery))
      .toSorted((a, b) => b.profit - a.profit);
  }, [bettingHouses, query, statusFilter]);

  function startEdit(house: BettingHouse) {
    setEditingId(house.id);
    setName(house.name);
    setWebsite(house.website ?? '');
    setNotes(house.notes ?? '');
  }

  function resetForm() {
    setEditingId('');
    setName('');
    setWebsite('');
    setNotes('');
  }

  return (
    <section className="page-grid">
      <Panel title="Cadastro e gestão de casas" subtitle="Controle por organização, status e desempenho" className="wide-panel">
        <form
          className="house-form"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            const trimmedName = name.trim();
            if (!trimmedName) return;

            if (editingHouse) {
              void onUpdateHouse({
                id: editingHouse.id,
                name: trimmedName,
                website: website.trim() || undefined,
                notes: notes.trim() || undefined,
                status: editingHouse.status,
              });
            } else {
              void onCreateHouse(trimmedName, website.trim(), notes.trim());
            }
            resetForm();
          }}
        >
          <label className="search-field">
            <Building2 size={16} />
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome da casa" />
          </label>
          <label className="search-field">
            <Search size={16} />
            <input value={website} onChange={(event) => setWebsite(event.target.value)} placeholder="Site opcional" />
          </label>
          <label className="search-field">
            <input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Observações" />
          </label>
          <button className="primary-button" type="submit">
            {editingHouse ? <Pencil size={16} /> : <Plus size={16} />}
            {editingHouse ? 'Salvar casa' : 'Nova casa'}
          </button>
          {editingHouse ? (
            <button className="ghost-button" type="button" onClick={resetForm}>
              Cancelar
            </button>
          ) : null}
        </form>

        <div className="toolbar">
          <label className="search-field">
            <Search size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar casas" />
          </label>
          <label className="select-field compact-select">
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
              <option value="all">Todas</option>
              <option value="active">Ativas</option>
              <option value="inactive">Inativas</option>
            </select>
          </label>
        </div>

        <div className="cards-grid">
          {filteredHouses.map((house) => (
            <article className="house-card" key={house.id}>
              <div className="house-avatar">{house.name.slice(0, 2)}</div>
              <div>
                <h3>{house.name}</h3>
                <p>{house.website ?? 'Sem site cadastrado'}</p>
                <small>{house.notes ?? 'Sem observações'}</small>
              </div>
              <span className={house.status === 'active' ? 'badge success' : 'badge muted'}>{house.status === 'active' ? 'Ativa' : 'Inativa'}</span>
              <dl>
                <div>
                  <dt>Depósito</dt>
                  <dd>{currency(house.deposit)}</dd>
                </div>
                <div>
                  <dt>Retorno</dt>
                  <dd>{currency(house.returns)}</dd>
                </div>
                <div>
                  <dt>Lucro</dt>
                  <dd>{currency(house.profit)}</dd>
                </div>
                <div>
                  <dt>ROI</dt>
                  <dd>{percent(house.roi)}</dd>
                </div>
              </dl>
              <div className="card-actions">
                <button className="ghost-button" type="button" onClick={() => startEdit(house)}>
                  <Pencil size={15} />
                  Editar
                </button>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => void onUpdateHouse({ id: house.id, name: house.name, website: house.website, notes: house.notes, status: house.status === 'active' ? 'inactive' : 'active' })}
                >
                  {house.status === 'active' ? <XCircle size={15} /> : <CheckCircle2 size={15} />}
                  {house.status === 'active' ? 'Desativar' : 'Ativar'}
                </button>
              </div>
            </article>
          ))}
        </div>
      </Panel>
    </section>
  );
}
