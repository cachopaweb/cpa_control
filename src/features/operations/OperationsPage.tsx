import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Building2, CalendarDays, FileImage, Pause, Play, Plus, Search, Square } from 'lucide-react';
import type { BettingHouse, Cycle, Operation } from '../../data/types';
import { MetricCard } from '../../shared/components/MetricCard';
import { Panel } from '../../shared/components/Panel';
import { currency, shortDate } from '../../utils/format';

export function OperationsPage({
  bettingHouses,
  operations,
  selectedOperation,
  setSelectedOperationId,
  onCreateOperation,
  onAddCycle,
  onUpdateOperationStatus,
}: {
  bettingHouses: BettingHouse[];
  operations: Operation[];
  selectedOperation: Operation | undefined;
  setSelectedOperationId: (id: string) => void;
  onCreateOperation: (date: string, houseId: string, game: string) => void | Promise<void>;
  onAddCycle: (operationId: string, values: Omit<Cycle, 'id' | 'cycleNumber' | 'roi'>, proofFile?: File | null) => void | Promise<void>;
  onUpdateOperationStatus: (operationId: string, status: Operation['status']) => void | Promise<void>;
}) {
  const activeHouses = useMemo(() => bettingHouses.filter((house) => house.status === 'active'), [bettingHouses]);
  const firstActiveHouseId = activeHouses[0]?.id ?? '';
  const [operationDate, setOperationDate] = useState(new Date().toISOString().slice(0, 10));
  const [houseId, setHouseId] = useState(firstActiveHouseId);
  const [game, setGame] = useState('Aviator');
  const [deposit, setDeposit] = useState('0');
  const [withdrawal, setWithdrawal] = useState('0');
  const [bonus, setBonus] = useState('0');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [cycleError, setCycleError] = useState('');
  const selectedHouseIsActive = useMemo(() => activeHouses.some((house) => house.id === houseId), [activeHouses, houseId]);
  const canCreateOperation = Boolean(firstActiveHouseId && houseId && game.trim());
  const canAddCycle = Boolean(selectedOperation?.status === 'open' && proofFile && proofFile.type.startsWith('image/') && proofFile.size <= 10 * 1024 * 1024);

  useEffect(() => {
    if (firstActiveHouseId && (!houseId || !selectedHouseIsActive)) {
      setHouseId(firstActiveHouseId);
    }
  }, [firstActiveHouseId, houseId, selectedHouseIsActive]);

  return (
    <section className="two-column">
      <Panel title="Operações" subtitle="Criação e acompanhamento por casa">
        <form
          className="operation-form"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            if (!canCreateOperation) return;
            void onCreateOperation(operationDate, houseId, game.trim());
          }}
        >
          <label className="search-field">
            <CalendarDays size={16} />
            <input value={operationDate} onChange={(event) => setOperationDate(event.target.value)} type="date" />
          </label>
          <label className="select-field">
            <Building2 size={16} />
            <select value={houseId} onChange={(event) => setHouseId(event.target.value)} disabled={activeHouses.length === 0}>
              {activeHouses.length === 0 ? <option value="">Cadastre uma casa ativa</option> : null}
              {activeHouses.map((house) => (
                <option value={house.id} key={house.id}>
                  {house.name}
                </option>
              ))}
            </select>
          </label>
          <label className="search-field">
            <Search size={16} />
            <input value={game} onChange={(event) => setGame(event.target.value)} placeholder="Jogo" />
          </label>
          <button className="primary-button" type="submit" disabled={!canCreateOperation}>
            <Plus size={16} />
            Nova operação
          </button>
        </form>

        <div className="operation-list">
          {operations.length === 0 ? (
            <div className="empty-state compact">
              <strong>Nenhuma operação criada</strong>
              <span>Crie a primeira operação para iniciar o registro dos ciclos.</span>
            </div>
          ) : null}
          {operations.map((operation) => (
            <button key={operation.id} className={selectedOperation?.id === operation.id ? 'operation-item selected' : 'operation-item'} onClick={() => setSelectedOperationId(operation.id)}>
              <div>
                <strong>{operation.bettingHouseName}</strong>
                <span>
                  {operation.operatorName} · {operation.game} · {operation.status}
                </span>
              </div>
              <b>{currency(operation.profitLoss)}</b>
            </button>
          ))}
        </div>
      </Panel>

      <Panel title={selectedOperation ? `${shortDate(selectedOperation.date)} · ${selectedOperation.bettingHouseName}` : 'Ciclos'} subtitle={selectedOperation ? `${selectedOperation.operatorName} · ${selectedOperation.game}` : 'Selecione ou crie uma operação'}>
        {selectedOperation ? (
          <>
            <div className="stats-grid mini">
              <MetricCard label="Depósitos" value={currency(selectedOperation.depositAmount)} tone="danger" />
              <MetricCard label="Saques" value={currency(selectedOperation.withdrawalAmount)} positive />
              <MetricCard label="Saldo atual" value={currency(selectedOperation.currentBalance)} />
              <MetricCard label="Resultado" value={currency(selectedOperation.profitLoss)} positive />
            </div>

            <div className="section-header">
              <h3>Ciclos ({selectedOperation.cycles.length})</h3>
              <div className="card-actions">
                <button className="ghost-button" type="button" onClick={() => void onUpdateOperationStatus(selectedOperation.id, selectedOperation.status === 'paused' ? 'open' : 'paused')} disabled={selectedOperation.status === 'closed'}>
                  {selectedOperation.status === 'paused' ? <Play size={15} /> : <Pause size={15} />}
                  {selectedOperation.status === 'paused' ? 'Retomar' : 'Pausar'}
                </button>
                <button className="ghost-button" type="button" onClick={() => void onUpdateOperationStatus(selectedOperation.id, 'closed')} disabled={selectedOperation.status === 'closed'}>
                  <Square size={15} />
                  Encerrar
                </button>
              </div>
            </div>

            <form
              className="cycle-form"
              onSubmit={(event: FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                if (!selectedOperation || selectedOperation.status !== 'open') {
                  setCycleError('A operação precisa estar aberta para receber ciclos.');
                  return;
                }
                if (!canAddCycle) {
                  setCycleError('Anexe uma imagem válida de até 10 MB antes de salvar o ciclo.');
                  return;
                }
                setCycleError('');
                void onAddCycle(
                  selectedOperation.id,
                  {
                    deposit: Number(deposit),
                    withdrawal: Number(withdrawal),
                    bonus: Number(bonus),
                    result: 0,
                    status: 'under_review',
                    proofName: proofFile?.name,
                  },
                  proofFile,
                );
                setDeposit('0');
                setWithdrawal('0');
                setBonus('0');
                setProofFile(null);
              }}
            >
              <input value={deposit} onChange={(event) => setDeposit(event.target.value)} type="number" min="0" step="0.01" placeholder="Depósito" />
              <input value={withdrawal} onChange={(event) => setWithdrawal(event.target.value)} type="number" min="0" step="0.01" placeholder="Saque" />
              <input value={bonus} onChange={(event) => setBonus(event.target.value)} type="number" min="0" step="0.01" placeholder="Baú/Bônus" />
              <label className="file-field">
                <FileImage size={16} />
                <span>{proofFile?.name ?? 'Comprovante obrigatório'}</span>
                <input onChange={(event) => setProofFile(event.target.files?.[0] ?? null)} type="file" accept="image/png,image/jpeg,image/webp" capture="environment" />
              </label>
              <button className="primary-button" type="submit" disabled={!canAddCycle}>
                <Plus size={16} />
                Adicionar ciclo
              </button>
            </form>
            {cycleError ? <p className="auth-error">{cycleError}</p> : null}

            <div className="table">
              <div className="table-row table-head">
                <span>#</span>
                <span>Depósito</span>
                <span>Saque</span>
                <span>Baú/Bônus</span>
                <span>Resultado</span>
                <span>Prova</span>
              </div>
              {selectedOperation.cycles.map((cycle) => (
                <div className="table-row" key={cycle.id}>
                  <span>#{cycle.cycleNumber}</span>
                  <span>{currency(cycle.deposit)}</span>
                  <span>{currency(cycle.withdrawal)}</span>
                  <span>{currency(cycle.bonus)}</span>
                  <strong>{currency(cycle.result)}</strong>
                  <span className="proof-chip">
                    <FileImage size={14} />
                    {cycle.proofName}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <FileImage size={28} />
            <strong>Comece criando uma operação</strong>
            <span>Depois disso, os ciclos com depósito, saque, bônus e comprovantes aparecerão aqui.</span>
          </div>
        )}
      </Panel>
    </section>
  );
}
