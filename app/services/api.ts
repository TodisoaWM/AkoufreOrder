import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { Commande, StockEntree, StatVente, RotationProduit, StockHistoriqueJour, DashboardStats, JourFerie } from '../types';

// Port du serveur backend
const BACKEND_PORT = 3000;

// Détermine l'adresse du backend selon la plateforme.
// - Sur le web : localhost (même machine que le navigateur).
// - Sur un téléphone (Expo Go) : « localhost » désignerait le téléphone lui-même,
//   donc on récupère automatiquement l'IP du PC qui fait tourner Expo.
function resolveBaseUrl(): string {
  if (Platform.OS === 'web') {
    return `http://localhost:${BACKEND_PORT}/api`;
  }
  // hostUri ressemble à "192.168.1.10:8081" en développement Expo
  const hostUri =
    Constants.expoConfig?.hostUri ||
    // @ts-ignore — champs de repli selon la version d'Expo
    (Constants.manifest2 as any)?.extra?.expoGo?.developer?.host ||
    // @ts-ignore
    (Constants.manifest as any)?.debuggerHost;

  const host = typeof hostUri === 'string' ? hostUri.split(':')[0] : undefined;
  if (host) {
    return `http://${host}:${BACKEND_PORT}/api`;
  }
  // Repli (build de production : à remplacer par l'URL réelle du serveur déployé)
  return `http://localhost:${BACKEND_PORT}/api`;
}

const BASE_URL = resolveBaseUrl();

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
