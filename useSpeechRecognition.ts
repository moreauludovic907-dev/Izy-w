import { useCallback, useEffect, useRef, useState } from 'react';

export type SpeechState = 'idle' | 'listening' | 'unsupported' | 'denied' | 'error';

export function useSpeechRecognition(lang = 'fr-FR') {
  const [state, setState] = useState<SpeechState>('idle');
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [volume, setVolume] = useState(0);
  const recRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setState('unsupported'); return; }
    const rec = new SR();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e: any) => {
      let final = '';
      let inter = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t + ' ';
        else inter += t;
      }
      if (final) setTranscript(p => (p + ' ' + final).trim());
      setInterim(inter);
    };
    rec.onerror = (e: any) => setState(e.error === 'not-allowed' ? 'denied' : 'error');
    rec.onend = () => { setState(s => (s === 'listening' ? 'idle' : s)); setInterim(''); };
    recRef.current = rec;
    return () => { try { rec.stop(); } catch {} };
  }, [lang]);

  // Audio level meter (pour animer le noyau en réaction à la voix)
  const startAudioMeter = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const loop = () => {
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        const avg = sum / data.length / 255; // 0..1
        setVolume(avg);
        rafRef.current = requestAnimationFrame(loop);
      };
      loop();
    } catch (e) {
      console.warn('Audio meter failed', e);
    }
  }, []);

  const stopAudioMeter = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null; }
    setVolume(0);
  }, []);

  const start = useCallback(async () => {
    if (!recRef.current) return;
    setTranscript(''); setInterim('');
    try {
      recRef.current.start();
      setState('listening');
      await startAudioMeter();
    } catch {
      setState('error');
    }
  }, [startAudioMeter]);

  const stop = useCallback(() => {
    if (!recRef.current) return;
    try { recRef.current.stop(); } catch {}
    setState('idle');
    stopAudioMeter();
  }, [stopAudioMeter]);

  const reset = useCallback(() => { setTranscript(''); setInterim(''); }, []);

  return { state, transcript, interim, volume, start, stop, reset };
}
