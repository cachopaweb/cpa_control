import { useState, type FormEvent } from 'react';
import { Building2, Plus, Search } from 'lucide-react';
import type { BettingHouse } from '../../data/types';
import { Panel } from '../../shared/components/Panel';
import { currency, percent } from '../../utils/format';

export function HousesPage({
  bettingHouses,
  onCreateHouse,
}: {
  bettingHouses: BettingHouse[];
  onCreateHouse: (name: string, website: string) => void | Promise<void>;
}) {
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');

  return (
    <section className="page-grid">
      <Panel title="Cadastro e gestão de casas" subtitle="Controle por organização, status e desempenho" className="wide-panel">
        <form
          className="toolbar"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            if (!name.trim()) return;
            void onCreateHouse(name.trim(), website.trim());
            setName('');
            setWebsite('');
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
          <button className="primary-button" type="submit">
            <Plus size={16} />
            Nova casa
          </button>
        </form>

        <div className="cards-grid">
          {bettingHouses.map((house) => (
            <article className="house-card" key={house.id}>
              <div className="house-avatar">{house.name.slice(0, 2)}</div>
              <div>
                <h3>{house.name}</h3>
                <p>{house.website ?? 'Sem site cadastrado'}</p>
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
            </article>
          ))}
        </div>
      </Panel>
    </section>
  );
}
