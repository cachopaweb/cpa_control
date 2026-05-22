import { Moon, Sun } from 'lucide-react';
import type { ThemeMode } from '../../data/types';
import { isFirebaseConfigured } from '../../data/firebase';
import { Panel } from '../../shared/components/Panel';

export function SettingsPage({ themeMode, setThemeMode }: { themeMode: ThemeMode; setThemeMode: (mode: ThemeMode) => void }) {
  return (
    <section className="two-column">
      <Panel title="Preferências" subtitle="Tema e ambiente">
        <div className="theme-options">
          {(['system', 'light', 'dark'] as ThemeMode[]).map((mode) => (
            <button key={mode} className={themeMode === mode ? 'theme-option active' : 'theme-option'} onClick={() => setThemeMode(mode)}>
              {mode === 'dark' ? <Moon /> : <Sun />}
              <span>{mode === 'system' ? 'Sistema' : mode === 'light' ? 'Claro' : 'Escuro'}</span>
            </button>
          ))}
        </div>
      </Panel>
      <Panel title="Firebase" subtitle="Integração pronta para ambiente real">
        <div className="settings-list">
          <div>
            <strong>Status</strong>
            <span>{isFirebaseConfigured ? 'Configurado por .env' : 'Aguardando variáveis VITE_FIREBASE_*'}</span>
          </div>
          <div>
            <strong>Dados</strong>
            <span>Mock local até conectar Authentication, Firestore e Storage</span>
          </div>
          <div>
            <strong>Storage</strong>
            <span>Comprovantes dos ciclos serão enviados para Firebase Storage</span>
          </div>
        </div>
      </Panel>
    </section>
  );
}
