export interface Produit {
  categorie: string;
  code: string;
  article: string;
}

export interface ProduitAvecStock extends Produit {
  stockActuel: number;
  moyenneJour: number;
  stockSecurite: number;
}

export interface LigneCommande {
  produit: Produit;
  quantite: number;
  stock: number;
  moyenneJour: number;
  formulaHint: string;
}

export interface Commande {
  id: number;
  dateCommande: string;
  dateLivraison: string;
  statut: 'Soumis' | 'Modifiée' | 'Manqué';
  coefficient: number;
  totalUnites: number;
  lignes: LigneCommande[];
}

export interface StockEntree {
  produitCode: string;
  quantite: number;
  date: string;
}

export interface StatVente {
  date: string;
  totalUnites: number;
}

export interface RotationProduit {
  code: string;
  article: string;
  categorie: string;
  tauxRotation: number;
}

export interface JourFerie {
  id: number;
  date: string;
  description: string;
  coefficient: number;
}

export type TabName = 'Accueil' | 'Stock' | 'Commande' | 'Historique' | 'Stats';

export interface SuggestionCommande {
  lignes: LigneCommandeSuggestion[];
  totalUnites: number;
  coefficient: number;
  dateLivraison: string;
  labelPeriode: string;
}

export interface LigneCommandeSuggestion {
  code: string;
  article: string;
  categorie: string;
  quantite: number;
  stock: number;
  moyenneJour: number;
  coefficient: number;
  formulaHint: string;
}
