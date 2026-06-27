import { Commande, StockEntree, StatVente, RotationProduit, SuggestionCommande, StockHistoriqueJour } from '../types';

const BASE_URL = 'http://localhost:3000/api';

async function fetchJSON<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }
  return response.json() as Promise<T>;
}

// Stock
export const getDernierStock = (): Promise<Record<string, number>> =>
  fetchJSON<Record<string, number>>('/stock/dernier');

export const getHistoriqueStock = (): Promise<StockHistoriqueJour[]> =>
  fetchJSON<StockHistoriqueJour[]>('/stock/historique');

export const saveStock = (entrees: StockEntree[]): Promise<{ succes: boolean; count: number }> =>
  fetchJSON<{ succes: boolean; count: number }>('/stock', {
    method: 'POST',
    body: JSON.stringify({ entrees }),
  });

// Commandes
export const getCommandes = (): Promise<Commande[]> =>
  fetchJSON<Commande[]>('/commande');

export const saveCommande = (commande: Omit<Commande, 'id'>): Promise<Commande> =>
  fetchJSON<Commande>('/commande', {
    method: 'POST',
    body: JSON.stringify(commande),
  });

export const calculerSuggestion = (stock: Record<string, number>): Promise<SuggestionCommande> =>
  fetchJSON<SuggestionCommande>('/commande/calculer', {
    method: 'POST',
    body: JSON.stringify({ stock }),
  });

// Stats
export const getVentes = (): Promise<StatVente[]> =>
  fetchJSON<StatVente[]>('/stats/ventes');

export const getRotation = (): Promise<RotationProduit[]> =>
  fetchJSON<RotationProduit[]>('/stats/rotation');
