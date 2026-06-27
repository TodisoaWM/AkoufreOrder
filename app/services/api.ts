import { Commande, StockEntree, StatVente, RotationProduit, StockHistoriqueJour, DashboardStats, JourFerie } from '../types';

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
export interface DernierStockItem {
  id: number;
  code: string;
  article: string;
  categorie: string;
  moyenneJour: number;
  stockSecurite: number;
  dernierStock: number | null;
  dateDernierStock: string | null;
}

export const getDernierStock = (): Promise<DernierStockItem[]> =>
  fetchJSON<DernierStockItem[]>('/stock/dernier');

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

export interface SaveCommandePayload {
  dateLivraison: string;
  coefficient: number;
  lignes: { produitCode: string; quantite: number; stock: number }[];
}

export const saveCommande = (commande: SaveCommandePayload): Promise<Commande> =>
  fetchJSON<Commande>('/commande', {
    method: 'POST',
    body: JSON.stringify(commande),
  });

export interface SuggestionLigne {
  produitId: number;
  code: string;
  article: string;
  categorie: string;
  quantite: number;
  stockActuel: number;
  moyenneJour: number;
  stockSecurite: number;
  coefficient: number;
}

export interface SuggestionResponse {
  lignes: SuggestionLigne[];
  totalUnites: number;
  coefficient: number;
  joursACouvrir: number;
  label: string;
  dateLivraison: string;
}

// Suggestion calculée par le backend à partir des vraies pesées (moyenne hybride).
export const calculerSuggestion = (dateLivraison: string): Promise<SuggestionResponse> =>
  fetchJSON<SuggestionResponse>('/commande/calculer', {
    method: 'POST',
    body: JSON.stringify({ dateLivraison }),
  });

// Stats
export const getVentes = (): Promise<StatVente[]> =>
  fetchJSON<StatVente[]>('/stats/ventes');

export const getRotation = (): Promise<RotationProduit[]> =>
  fetchJSON<RotationProduit[]>('/stats/rotation');

export const getDashboard = (): Promise<DashboardStats> =>
  fetchJSON<DashboardStats>('/stats/dashboard');

export const getFetes = (): Promise<JourFerie[]> =>
  fetchJSON<JourFerie[]>('/stats/fetes');
