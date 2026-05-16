import { useState } from 'react';
import { IZYCore } from '@/components/IZYCore';
import { saveProfile, setMeta, getProfile } from '@/lib/db';
import { uid } from '@/lib/quote';
import type { UserProfile } from '@/types';

type Props = { onAuth: () => void };

export function LoginScreen({ onAuth }: Props) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError('');
    if (!email || !password) {
      setError('Email et mot de passe requis');
      return;
    }
    setLoading(true);
    try {
      const existing = await getProfile();
      if (mode === 'signup' || !existing) {
        const p: UserProfile = {
          id: existing?.id || uid(),
          email,
          companyName: company || existing?.companyName || 'Mon entreprise',
          trade: existing?.trade,
          phone: existing?.phone,
          siret: existing?.siret,
        };
        await saveProfile(p);
      }
      await setMeta('session', { email, loggedAt: Date.now() });
      onAuth();
    } catch (e: any) {
      setError(e?.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-8 relative">
      <div className="w-full max-w-md screen-enter">
        <div className="flex justify-center mb-6">
          <IZYCore size={140} />
        </div>

        <h1 className="font-display text-3xl text-center mb-2" style={{ letterSpacing: '-0.02em' }}>
          {mode === 'signup' ? (
            <>Bienvenue sur <span className="text-violet italic">IZY</span></>
          ) : (
            <>Re-bienvenue <span className="text-violet italic">chef</span></>
          )}
        </h1>
        <p className="text-center text-sm mb-8" style={{ color: 'var(--ink-dim)' }}>
          {mode === 'signup' ? 'Ton compagnon IA terrain' : 'Reprends où tu en étais'}
        </p>

        <div className="space-y-3 mb-4">
          {mode === 'signup' && (
            <input
              type="text"
              placeholder="Nom de ton entreprise"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full rounded-2xl px-4 py-3.5 text-sm card"
            />
          )}
          <input
            type="email"
            placeholder="Email pro"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-2xl px-4 py-3.5 text-sm card"
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            className="w-full rounded-2xl px-4 py-3.5 text-sm card"
          />
        </div>

        {error && <p className="text-xs mb-3 text-center" style={{ color: '#FF6B6B' }}>{error}</p>}

        <button
          onClick={submit}
          disabled={loading}
          className="btn-violet w-full py-4 rounded-2xl font-semibold text-sm mb-3 disabled:opacity-50"
        >
          {loading ? '…' : mode === 'signup' ? 'Activer IZY' : 'Se connecter'}
        </button>

        <button
          onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
          className="w-full text-xs text-center"
          style={{ color: 'var(--ink-dim)' }}
        >
          {mode === 'signup' ? "J'ai déjà un compte" : 'Créer un compte'}
        </button>

        <p className="text-[10px] text-center mt-8 font-mono tracking-wider" style={{ color: 'var(--ink-faint)' }}>
          Mode local · Données chiffrées sur ton appareil
        </p>
      </div>
    </div>
  );
}
