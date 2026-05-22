import { useState, type FormEvent } from 'react';
import { Link2 } from 'lucide-react';

export function AcceptInviteScreen({
  inviteId,
  loading,
  error,
  onAcceptInvite,
  onBackToLogin,
}: {
  inviteId: string | null;
  loading: boolean;
  error: string;
  onAcceptInvite: (inviteId: string, name: string, email: string, password: string) => Promise<void>;
  onBackToLogin: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const canSubmit = Boolean(inviteId && name.trim() && email.trim() && password.length >= 6 && !loading);

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="brand auth-brand">
          <div className="brand-mark">C</div>
          <div>
            <strong>CPA Control</strong>
            <span>Convite para operador</span>
          </div>
        </div>

        <div className="invite-accept-header">
          <Link2 size={20} />
          <div>
            <strong>Aceitar convite</strong>
            <span>Crie seu acesso para registrar operações e ciclos.</span>
          </div>
        </div>

        <form
          className="auth-form"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            if (!inviteId || !canSubmit) return;
            void onAcceptInvite(inviteId, name.trim(), email.trim(), password);
          }}
        >
          <label>
            Nome
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Seu nome" />
          </label>
          <label>
            Email do convite
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="operador@email.com" />
          </label>
          <label>
            Senha
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="mínimo 6 caracteres" />
          </label>

          {!inviteId ? <p className="auth-error">Link de convite inválido ou incompleto.</p> : null}
          {error ? <p className="auth-error">{error}</p> : null}

          <button className="primary-button" type="submit" disabled={!canSubmit}>
            {loading ? 'Ativando...' : 'Ativar acesso'}
          </button>
          <button className="ghost-button" type="button" onClick={onBackToLogin}>
            Voltar para login
          </button>
        </form>
      </section>
    </main>
  );
}
