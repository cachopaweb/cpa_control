import { useState, type FormEvent } from 'react';

export function AuthScreen({
  loading,
  error,
  onLogin,
  onGoogleLogin,
  onCreateFirstAdmin,
  onDemo,
}: {
  loading: boolean;
  error: string;
  onLogin: (email: string, password: string) => Promise<void>;
  onGoogleLogin: () => Promise<void>;
  onCreateFirstAdmin: (name: string, organizationName: string, email: string, password: string) => Promise<void>;
  onDemo: () => void;
}) {
  const [mode, setMode] = useState<'login' | 'admin'>('login');
  const [name, setName] = useState('Admin CPA');
  const [organizationName, setOrganizationName] = useState('Minha operação CPA');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="brand auth-brand">
          <div className="brand-mark">C</div>
          <div>
            <strong>CPA Control</strong>
            <span>MicroSaaS para casas de aposta</span>
          </div>
        </div>

        <div className="auth-tabs">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Entrar</button>
          <button className={mode === 'admin' ? 'active' : ''} onClick={() => setMode('admin')}>Criar admin</button>
        </div>

        <form
          className="auth-form"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            if (mode === 'login') {
              void onLogin(email, password);
              return;
            }
            void onCreateFirstAdmin(name, organizationName, email, password);
          }}
        >
          {mode === 'admin' && (
            <>
              <label>
                Nome do admin
                <input value={name} onChange={(event) => setName(event.target.value)} />
              </label>
              <label>
                Organização
                <input value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} />
              </label>
            </>
          )}
          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="admin@email.com" />
          </label>
          <label>
            Senha
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="mínimo 6 caracteres" />
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar com Firebase' : 'Criar primeiro admin'}
          </button>
          <button className="google-button" type="button" onClick={() => void onGoogleLogin()} disabled={loading}>
            <span>G</span>
            Entrar com Google
          </button>
          <button className="ghost-button" type="button" onClick={onDemo}>
            Entrar em modo demonstração
          </button>
        </form>
      </section>
    </main>
  );
}
