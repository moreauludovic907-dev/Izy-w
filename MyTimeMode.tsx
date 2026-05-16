import { useEffect, useState } from 'react';
import { TopBar } from '@/components/TopBar';
import { IZYCore } from '@/components/IZYCore';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { parseDictationToQuote } from '@/lib/ai';
import { newQuoteNumber, uid, finalizeQuote } from '@/lib/quote';
import { saveQuote, listQuotes } from '@/lib/db';
import { fmtEUR } from '@/lib/quote';
import type { ModeName, Quote } from '@/types';
import { FileText, Check, RotateCcw } from 'lucide-react';

type Props = {
  onNavigate: (m: ModeName, data?: any) => void;
};

export function MyTimeMode({ onNavigate }: Props) {
  const speech = useSpeechRecognition('fr-FR');
  const [processing, setProcessing] = useState(false);
  const [quotes, setQuotes] = useState<Quote[]>([]);

  useEffect(() => {
    listQuotes().then(setQuotes);
  }, []);

  const liveText = (speech.transcript + ' ' + speech.interim).trim();
  const listening = speech.state === 'listening';

  const handleValidate = async () => {
    if (!liveText) return;
    speech.stop();
    setProcessing(true);
    try {
      const parsed = await parseDictationToQuote(liveText);
      const now = new Date().toISOString();
      const q = finalizeQuote({
        id: uid(),
        number: newQuoteNumber(),
        clientName: parsed.clientName || 'Nouveau client',
        lines: parsed.lines,
        notes: parsed.notes || undefined,
        status: 'draft',
        createdAt: now,
        updatedAt: now,
      });
      await saveQuote(q);
      onNavigate('quote-detail', q.id);
    } catch (e) {
      console.error(e);
      alert('Erreur lors de la création du devis.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <TopBar onBack={() => onNavigate('home')} title="MY TIME" />

      <div className="flex-1 flex flex-col items-center justify-center px-5 -mt-4">
        <p
          className="font-mono text-[10px] tracking-[0.4em] uppercase mb-2"
          style={{ color: listening ? 'var(--izy-violet-glow, #C4B5FD)' : 'var(--ink-faint)' }}
        >
          {speech.state === 'unsupported'
            ? '✕ DICTÉE NON SUPPORTÉE'
            : listening
            ? '● EN ÉCOUTE'
            : processing
            ? '⚡ ANALYSE'
            : 'PRÊT'}
        </p>

        {!liveText && !processing && (
          <h1 className="font-display text-3xl mb-8 text-center" style={{ letterSpacing: '-0.02em' }}>
            Parle, <span className="text-violet italic">je rédige</span>.
          </h1>
        )}

        {liveText && (
          <div className="w-full max-w-md mb-8 card rounded-3xl p-5">
            <p
              className="font-mono text-[9px] tracking-[0.2em] uppercase mb-2"
              style={{ color: 'var(--ink-faint)' }}
            >
              Ta dictée
            </p>
            <p className="font-display text-lg leading-relaxed">
              {speech.transcript}
              <span style={{ color: 'var(--ink-faint)' }}>
                {speech.interim ? ' ' + speech.interim : ''}
              </span>
            </p>
          </div>
        )}

        <IZYCore
          size={220}
          active={listening || processing}
          volume={speech.volume}
          onClick={() => {
            if (processing) return;
            if (listening) speech.stop();
            else speech.start();
          }}
        />

        {!liveText && !listening && !processing && (
          <p className="mt-8 text-xs text-center max-w-xs" style={{ color: 'var(--ink-dim)' }}>
            Touche le noyau et dis : "Pose PAC Daikin, 8h main d'œuvre, TVA 10%"
          </p>
        )}

        {speech.state === 'unsupported' && (
          <div className="mt-6 card rounded-2xl p-4 max-w-md text-sm" style={{ color: 'var(--ink-dim)' }}>
            Ce navigateur ne supporte pas la dictée. Ouvre IZY sur Chrome (Android) ou Safari (iOS).
          </div>
        )}
        {speech.state === 'denied' && (
          <p className="mt-4 text-xs" style={{ color: '#FF9999' }}>
            Permission micro refusée. Vérifie les réglages de ton navigateur.
          </p>
        )}
      </div>

      {/* Actions bas */}
      <div className="safe-bottom px-5 pb-6 pt-2">
        {liveText && !listening && !processing && (
          <div className="flex gap-3 mb-3">
            <button
              onClick={speech.reset}
              className="flex-1 py-4 rounded-2xl card font-semibold text-sm flex items-center justify-center gap-2"
            >
              <RotateCcw size={16} />
              Effacer
            </button>
            <button
              onClick={handleValidate}
              className="btn-violet flex-1 py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2"
            >
              <Check size={16} />
              Créer devis
            </button>
          </div>
        )}

        {/* Récents */}
        {quotes.length > 0 && !liveText && !listening && (
          <div className="mt-4">
            <p
              className="font-mono text-[9px] tracking-[0.3em] uppercase mb-2 px-1"
              style={{ color: 'var(--ink-faint)' }}
            >
              Devis récents
            </p>
            <div className="space-y-2">
              {quotes.slice(0, 3).map((q) => (
                <button
                  key={q.id}
                  onClick={() => onNavigate('quote-detail', q.id)}
                  className="w-full rounded-2xl card card-hover p-3 flex items-center gap-3"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)' }}
                  >
                    <FileText size={14} className="text-violet-300" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium truncate">{q.clientName}</p>
                    <p className="text-[10px] font-mono" style={{ color: 'var(--ink-faint)' }}>
                      {q.number}
                    </p>
                  </div>
                  <p className="font-display text-base text-violet">{fmtEUR(q.totalTTC)}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
