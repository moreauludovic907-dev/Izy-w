import { useEffect, useState } from 'react';
import { LoginScreen } from '@/modes/LoginScreen';
import { HomeScreen } from '@/modes/HomeScreen';
import { MyTimeMode } from '@/modes/MyTimeMode';
import { ModeIzyMode } from '@/modes/ModeIzyMode';
import { SocieteMode } from '@/modes/SocieteMode';
import { OnAirMode } from '@/modes/OnAirMode';
import { QuoteDetailScreen } from '@/modes/QuoteDetailScreen';
import { getMeta } from '@/lib/db';
import type { ModeName } from '@/types';

export default function App() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [screen, setScreen] = useState<ModeName>('home');
  const [screenData, setScreenData] = useState<any>(null);

  useEffect(() => {
    getMeta('session').then((s: any) => setAuthed(!!(s && s.email)));
  }, []);

  const navigate = (m: ModeName, data?: any) => {
    setScreen(m);
    setScreenData(data);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  if (authed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="w-12 h-12 rounded-full border-2 animate-spin"
          style={{ borderColor: '#8B5CF6', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  if (!authed) return <LoginScreen onAuth={() => setAuthed(true)} />;

  return (
    <div className="min-h-screen max-w-md mx-auto" key={screen}>
      <div className="screen-enter">
        {screen === 'home' && <HomeScreen onNavigate={navigate} onLogout={() => setAuthed(false)} />}
        {screen === 'on-air' && <OnAirMode onNavigate={navigate} />}
        {screen === 'my-time' && <MyTimeMode onNavigate={navigate} />}
        {screen === 'mode-izy' && <ModeIzyMode onNavigate={navigate} />}
        {screen === 'societe' && <SocieteMode onNavigate={navigate} />}
        {screen === 'quote-detail' && screenData && (
          <QuoteDetailScreen quoteId={screenData} onNavigate={navigate} />
        )}
      </div>
    </div>
  );
}
