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
  onAcceptInvite: (inviteId: string) => Promise<void>;
  onBackToLogin: () => void;
}) {
  const canSubmit = Boolean(inviteId && !loading);

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
            <span>Use a conta Google do mesmo email que recebeu o convite.</span>
          </div>
        </div>

        <div className="auth-form">
          {!inviteId ? <p className="auth-error">Link de convite invalido ou incompleto.</p> : null}
          {error ? <p className="auth-error">{error}</p> : null}

          <button className="google-button" type="button" onClick={() => inviteId && void onAcceptInvite(inviteId)} disabled={!canSubmit}>
            <span>G</span>
            {loading ? 'Ativando...' : 'Aceitar com Google'}
          </button>
          <button className="ghost-button" type="button" onClick={onBackToLogin}>
            Voltar para login
          </button>
        </div>
      </section>
    </main>
  );
}
