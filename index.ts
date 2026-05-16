export type Client = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt: string;
};

export type QuoteLine = {
  id: string;
  label: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  vatRate: number;
};

export type Quote = {
  id: string;
  number: string;
  clientName: string;
  lines: QuoteLine[];
  notes?: string;
  status: 'draft' | 'sent' | 'paid';
  createdAt: string;
  updatedAt: string;
  totalHT: number;
  totalTTC: number;
  totalVAT: number;
};

export type UserProfile = {
  id: string;
  email: string;
  companyName: string;
  trade?: string;
  siret?: string;
  phone?: string;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'izy';
  content: string;
  timestamp: number;
};

export type ModeName = 'home' | 'on-air' | 'my-time' | 'mode-izy' | 'societe' | 'quote-detail';
