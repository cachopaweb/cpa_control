import { useState, type FormEvent } from 'react';

export function AuthScreen({
  loading,
  error,
  hasFirstAdmin,
  onLogin,
  onCreateFirstAdmin,
  onDemo,
}: {
  loading: boolean;
  error: string;
  hasFirstAdmin: boolean;
  onLogin: () => Promise<void>;
  onCreateFirstAdmin: (organizationName: string) => Promise<void>;
  onDemo: () => void;
}) {
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [organizationName, setOrganizationName] = useState('Minha operacao CPA');
  const [localError, setLocalError] = useState('');
  const trimmedOrganizationName = organizationName.trim();

  function submitFirstAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!trimmedOrganizationName) {
      setLocalError('Informe o nome da organizacao.');
      return;
    }

    setLocalError('');
    void onCreateFirstAdmin(trimmedOrganizationName);
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="brand auth-brand">
          <div className="brand-mark">C</div>
          <div>
            <strong>CPA Control</strong>
            <span>Controle de operacoes CPA</span>
          </div>
        </div>

        <div className="auth-heading">
          <h1>{isCreatingAdmin ? 'Criar primeiro admin' : 'Entrar'}</h1>
          <p>{isCreatingAdmin ? 'Use sua conta Google para iniciar a organizacao.' : 'Acesse usando sua conta Google cadastrada.'}</p>
        </div>

        {isCreatingAdmin ? (
          <form className="auth-form" onSubmit={submitFirstAdmin}>
            <label>
              Organizacao
              <input value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} autoComplete="organization" />
            </label>

            {localError || error ? <p className="auth-error">{localError || error}</p> : null}

            <button className="google-button" type="submit" disabled={loading || !trimmedOrganizationName}>
              <span>G</span>
              {loading ? 'Aguarde...' : 'Criar admin com Google'}
            </button>
            <button className="ghost-button" type="button" onClick={() => setIsCreatingAdmin(false)} disabled={loading}>
              Voltar
            </button>
          </form>
        ) : (
          <div className="auth-form">
            {error ? <p className="auth-error">{error}</p> : null}

            <button className="google-button" type="button" onClick={() => void onLogin()} disabled={loading}>
              <span>G</span>
              {loading ? 'Aguarde...' : 'Entrar com Google'}
            </button>
            <button className="ghost-button demo-button" type="button" onClick={onDemo} disabled={loading}>
              Modo demonstracao
            </button>

            {!hasFirstAdmin ? (
              <div className="auth-secondary">
                <button type="button" onClick={() => setIsCreatingAdmin(true)} disabled={loading}>
                  Criar primeiro admin
                </button>
              </div>
            ) : null}
          </div>
        )}
      </section>
    </main>
  );
}
