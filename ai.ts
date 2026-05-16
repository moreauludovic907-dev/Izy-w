import type { QuoteLine, ChatMessage } from '@/types';
import { uid } from './quote';

export type ParsedQuote = {
  clientName: string | null;
  lines: QuoteLine[];
  notes: string | null;
};

const env = (import.meta as any).env || {};
const ANTHROPIC_KEY = env.VITE_ANTHROPIC_API_KEY || '';

// ============== Dictation → Quote parser ==============
export async function parseDictationToQuote(transcript: string): Promise<ParsedQuote> {
  if (!transcript.trim()) return { clientName: null, lines: [], notes: null };

  if (ANTHROPIC_KEY) {
    try {
      const result = await callAnthropic(
        'parse-quote',
        `Tu transformes la dictée d'un artisan BTP français en JSON. Format strict :
{"client_name": string|null, "lines": [{"label": string, "quantity": number, "unit": string, "unitPrice": number, "vatRate": 5.5|10|20}], "notes": string|null}
Pas de markdown, JSON pur.`,
        transcript
      );
      const parsed = JSON.parse(result.replace(/```json|```/g, '').trim());
      return {
        clientName: parsed.client_name ?? null,
        lines: (parsed.lines ?? []).map((l: any) => ({
          id: uid(),
          label: l.label,
          quantity: Number(l.quantity) || 1,
          unit: l.unit || 'u',
          unitPrice: Number(l.unitPrice) || 0,
          vatRate: Number(l.vatRate) || 10,
        })),
        notes: parsed.notes ?? null,
      };
    } catch (e) {
      console.warn('Claude parsing failed, fallback local', e);
    }
  }
  return mockParse(transcript);
}

// ============== Chat IZY ==============
export async function chatWithIzy(messages: ChatMessage[]): Promise<string> {
  if (ANTHROPIC_KEY) {
    try {
      const apiMessages = messages.map((m) => ({
        role: m.role === 'izy' ? 'assistant' : 'user',
        content: m.content,
      }));
      const result = await callAnthropic(
        'chat',
        `Tu es IZY, le compagnon IA d'un artisan du BTP. Tu réponds court, pratique, dans un ton direct et chaleureux. Tu connais le métier : devis, factures, conformité, matériaux, gestion d'équipe, comptabilité, droit du travail. Tu tutoies. Tu appelles l'utilisateur "chef" parfois.`,
        '',
        apiMessages
      );
      return result.trim();
    } catch (e) {
      console.warn('Chat IZY failed', e);
    }
  }
  // Réponse mock par défaut
  const last = messages[messages.length - 1]?.content || '';
  return mockChatResponse(last);
}

// ============== Anthropic call (générique) ==============
async function callAnthropic(_purpose: string, system: string, userText: string, messages?: any[]): Promise<string> {
  const body: any = {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system,
  };
  if (messages) {
    body.messages = messages;
  } else {
    body.messages = [{ role: 'user', content: userText }];
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}`);
  const data = await res.json();
  return data.content
    .filter((b: any) => b.type === 'text')
    .map((b: any) => b.text)
    .join('');
}

// ============== MOCK : parser local ==============
function mockParse(transcript: string): ParsedQuote {
  const t = transcript.toLowerCase();
  const lines: QuoteLine[] = [];
  const patterns: Array<[RegExp, string]> = [
    [/(\d+(?:[.,]\d+)?)\s*(?:m[èe]tres?|m)\s+de\s+([a-zà-ÿ\s]+?)(?=[,.]|et\s|\d|$)/gi, 'm'],
    [/(\d+(?:[.,]\d+)?)\s*heures?\s+(?:de\s+)?([a-zà-ÿ\s]+?)(?=[,.]|et\s|\d|$)/gi, 'h'],
    [/(\d+(?:[.,]\d+)?)\s*m[2²]\s+de\s+([a-zà-ÿ\s]+?)(?=[,.]|et\s|\d|$)/gi, 'm²'],
    [/(\d+(?:[.,]\d+)?)\s*jours?\s+(?:de\s+)?([a-zà-ÿ\s]+?)(?=[,.]|et\s|\d|$)/gi, 'j'],
  ];
  for (const [rx, unit] of patterns) {
    let m;
    while ((m = rx.exec(t)) !== null) {
      const qty = parseFloat(m[1].replace(',', '.'));
      const label = m[2].trim().replace(/\s+/g, ' ');
      if (label.length > 1 && label.length < 80) {
        lines.push({ id: uid(), label: cap(label), quantity: qty, unit, unitPrice: 0, vatRate: 10 });
      }
    }
  }
  const pose = t.match(/pose(?:\s+de)?\s+([a-zà-ÿ\s\-]+?)(?=[,.]+(?:et|avec|\d|$))/i);
  if (pose) lines.push({ id: uid(), label: 'Pose ' + cap(pose[1].trim()), quantity: 1, unit: 'forfait', unitPrice: 0, vatRate: 10 });
  if (/d[ée]placement/i.test(t)) lines.push({ id: uid(), label: 'Déplacement', quantity: 1, unit: 'forfait', unitPrice: 0, vatRate: 10 });
  const vatM = t.match(/tva\s*(?:à|de)?\s*(\d+(?:[.,]\d+)?)/i);
  if (vatM) {
    const vat = parseFloat(vatM[1].replace(',', '.'));
    if ([5.5, 10, 20].includes(vat)) lines.forEach(l => l.vatRate = vat);
  }
  let clientName: string | null = null;
  const cM = transcript.match(/(?:pour|client)\s+(?:m\.?|monsieur|mme|madame)?\s*([A-ZÀ-Ÿ][a-zà-ÿ]+(?:\s+[A-ZÀ-Ÿ][a-zà-ÿ]+)?)/i);
  if (cM) clientName = cM[1].trim();
  if (lines.length === 0) {
    lines.push({ id: uid(), label: cap(transcript.trim().slice(0, 80)), quantity: 1, unit: 'u', unitPrice: 0, vatRate: 10 });
  }
  return { clientName, lines, notes: null };
}

function mockChatResponse(input: string): string {
  const t = input.toLowerCase();
  if (/bonjour|salut|hello|coucou/.test(t)) return "Salut chef ! Qu'est-ce qu'on attaque aujourd'hui ?";
  if (/devis/.test(t)) return "Pour un devis, utilise plutôt MY TIME — tu dictes, je rédige. Beaucoup plus rapide que de me l'expliquer ici.";
  if (/tva|impot|fiscal/.test(t)) return "La TVA dans le BTP rénovation logement de + de 2 ans : 10% (taux intermédiaire) ou 5,5% si éco-énergie. Neuf : 20%.";
  if (/factur/.test(t)) return "À partir du 1er sept 2026, toute entreprise française doit pouvoir recevoir des factures électroniques. Le format Factur-X est obligatoire en émission à partir de 2027.";
  if (/conform|réglement|loi/.test(t)) return "Pour quel sujet précisément ? Facturation, droit du travail, sécurité chantier, RGE ?";
  return "(Mode mock — pour avoir mes vraies capacités IA, configure une clé API Anthropic dans les paramètres)";
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
