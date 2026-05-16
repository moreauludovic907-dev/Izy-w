import { useEffect, useState } from 'react';
import { TopBar } from '@/components/TopBar';
import { IZYCore } from '@/components/IZYCore';
import { ModeCard } from '@/components/ModeCard';
import { Sheet } from '@/components/Sheet';
import { Camera, Mic, MessageCircle, BarChart3, LogOut } from 'lucide-react';
import { getProfile, setMeta } from '@/lib/db';
import type { ModeName, UserProfile } from '@/types';

type Props = {
  onNavigate: (m: ModeName) => void;
  onLogout: () => void;
};

export function HomeScreen({ onNavigate, onLogout }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    getProfile().then(setProfile);
  }, []);

  const logout = async () => {
    await setMeta('session', null);
    onLogout();
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <TopBar onProfile={() => setProfileOpen(true)} onAdd={() => setAddOpen(true)} />

      {/* Noyau central */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 -mt-4">
        <p
          className="font-mono text-[10px] tracking-[0.4em] uppercase mb-1"
          style={{ color: 'var(--ink-faint)' }}
        >
          {greeting()} {profile?.companyName ? '· ' + profile.companyName : ''}
        </p>
        <h1 className="font-display text-2xl mb-10 text-center" style={{ letterSpacing: '-0.02em' }}>
          Qu'est-ce qui se passe <span className="text-violet italic">chef</span> ?
        </h1>

        <IZYCore
          size={260}
          onClick={() => onNavigate('my-time')}
          label="Appuie pour parler"
        />
      </div>

      {/* 4 modes en grid */}
      <div className="px-5 pb-8 pt-8">
        <p className="font-mono text-[9px] tracking-[0.35em] uppercase mb-4 text-center" style={{ color: 'var(--ink-faint)' }}>
          ─── Modes ───
        </p>
        <div className="grid grid-cols-2 gap-3">
          <ModeCard
            icon={<Camera size={18} className="text-violet-300" />}
            label="ON AIR"
            sublabel="Caméra & assistance terrain"
            onClick={() => onNavigate('on-air')}
            comingSoon
          />
          <ModeCard
            icon={<Mic size={18} className="text-violet-300" />}
            label="MY TIME"
            sublabel="Devis vocaux"
            onClick={() => onNavigate('my-time')}
          />
          <ModeCard
            icon={<MessageCircle size={18} className="text-violet-300" />}
            label="MODE IZY"
            sublabel="Discute avec moi"
            onClick={() => onNavigate('mode-izy')}
          />
          <ModeCard
            icon={<BarChart3 size={18} className="text-violet-300" />}
            label="SOCIÉTÉ"
            sublabel="Pilote ton activité"
            onClick={() => onNavigate('societe')}
          />
        </div>
      </div>

      {/* Profil sheet */}
      <Sheet open={profileOpen} onClose={() => setProfileOpen(false)} title="Mon profil">
        <div className="space-y-3 mb-4">
          <div className="card rounded-2xl p-4">
            <p className="font-mono text-[9px] tracking-[0.2em] uppercase mb-1" style={{ color: 'var(--ink-faint)' }}>
              Entreprise
            </p>
            <p className="text-base font-medium">{profile?.companyName || '—'}</p>
          </div>
          <div className="card rounded-2xl p-4">
            <p className="font-mono text-[9px] tracking-[0.2em] uppercase mb-1" style={{ color: 'var(--ink-faint)' }}>
              Email
            </p>
            <p className="text-sm">{profile?.email || '—'}</p>
          </div>
          <p className="text-xs px-1 pt-1" style={{ color: 'var(--ink-faint)' }}>
            Paramètres complets, abonnement et facturation arrivent bientôt.
          </p>
        </div>
        <button
          onClick={logout}
          className="w-full py-3.5 rounded-2xl card flex items-center justify-center gap-2 text-sm font-semibold"
          style={{ color: '#FF6B6B' }}
        >
          <LogOut size={16} />
          Déconnexion
        </button>
      </Sheet>

      {/* Add quick sheet */}
      <Sheet open={addOpen} onClose={() => setAddOpen(false)} title="Ajout rapide">
        <div className="space-y-2">
          <QuickAddBtn label="Nouveau devis vocal" onClick={() => { setAddOpen(false); onNavigate('my-time'); }} />
          <QuickAddBtn label="Discuter avec IZY" onClick={() => { setAddOpen(false); onNavigate('mode-izy'); }} />
          <QuickAddBtn label="Voir mes statistiques" onClick={() => { setAddOpen(false); onNavigate('societe'); }} />
        </div>
        <p className="text-xs px-1 pt-4" style={{ color: 'var(--ink-faint)' }}>
          Bientôt : tarifs, matériaux, clients, mots-clés vocaux.
        </p>
      </Sheet>
    </div>
  );
}

function QuickAddBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left py-3 px-4 rounded-2xl card card-hover text-sm font-medium"
    >
      {label}
    </button>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}
