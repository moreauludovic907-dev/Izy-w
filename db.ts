import { openDB } from 'idb';
import type { Client, Quote, UserProfile, ChatMessage } from '@/types';

let _db: any = null;

export async function db() {
  if (_db) return _db;
  _db = await openDB('izy', 2, {
    upgrade(d) {
      if (!d.objectStoreNames.contains('clients')) d.createObjectStore('clients', { keyPath: 'id' });
      if (!d.objectStoreNames.contains('quotes')) d.createObjectStore('quotes', { keyPath: 'id' });
      if (!d.objectStoreNames.contains('messages')) d.createObjectStore('messages', { keyPath: 'id' });
      if (!d.objectStoreNames.contains('meta')) d.createObjectStore('meta');
    },
  });
  return _db;
}

// Clients
export async function listClients(): Promise<Client[]> { return (await db()).getAll('clients'); }
export async function saveClient(c: Client) { await (await db()).put('clients', c); }
export async function deleteClient(id: string) { await (await db()).delete('clients', id); }

// Quotes
export async function listQuotes(): Promise<Quote[]> {
  const all = await (await db()).getAll('quotes');
  return all.sort((a: Quote, b: Quote) => b.createdAt.localeCompare(a.createdAt));
}
export async function saveQuote(q: Quote) { await (await db()).put('quotes', q); }
export async function getQuote(id: string): Promise<Quote | undefined> { return (await db()).get('quotes', id); }
export async function deleteQuote(id: string) { await (await db()).delete('quotes', id); }

// Chat messages
export async function listMessages(): Promise<ChatMessage[]> {
  const all = await (await db()).getAll('messages');
  return all.sort((a: ChatMessage, b: ChatMessage) => a.timestamp - b.timestamp);
}
export async function saveMessage(m: ChatMessage) { await (await db()).put('messages', m); }
export async function clearMessages() {
  const d = await db();
  const tx = d.transaction('messages', 'readwrite');
  await tx.store.clear();
  await tx.done;
}

// Meta (profile, session)
export async function setMeta(key: string, value: any) { await (await db()).put('meta', value, key); }
export async function getMeta<T = any>(key: string): Promise<T | undefined> { return (await db()).get('meta', key); }

// Profile helpers
export async function getProfile(): Promise<UserProfile | null> {
  return (await getMeta<UserProfile>('profile')) ?? null;
}
export async function saveProfile(p: UserProfile) { await setMeta('profile', p); }
