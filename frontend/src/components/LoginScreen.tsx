import React, { FormEvent, useState } from 'react';
import { LockKeyhole } from 'lucide-react';

type Props = { onLogin: (password: string) => Promise<void> };

export function LoginScreen({ onLogin }: Props) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onLogin(password);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Connexion impossible. Vérifiez la configuration du serveur.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={submit}>
        <div className="login-icon"><LockKeyhole size={24} /></div>
        <h1>Suivi des projets</h1>
        <p className="muted">Connectez-vous pour accéder aux dossiers synchronisés du cabinet.</p>
        <label className="field">
          <span>Mot de passe du cabinet</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoFocus
          />
        </label>
        {error && <p className="login-error" role="alert">{error}</p>}
        <button className="btn primary login-submit" type="submit" disabled={busy || !password}>
          {busy ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </main>
  );
}
