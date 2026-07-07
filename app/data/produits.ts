import { Produit } from '../types';

export const PRODUITS: Produit[] = [
  { categorie: 'POULET ENTIER', code: 'PLEC0104', article: 'POULET ENTIER AKOUFRE' },
  { categorie: 'TETE & PATTES CHAIR', code: 'SSPC0402A', article: 'PATTES FRAIS' },
  { categorie: 'TETE & PATTES CHAIR', code: 'SSPC0402', article: 'TETE' },
  { categorie: 'FOIE & COEUR CHAIR', code: 'SSPC0202A', article: 'FOIE' },
  { categorie: 'FOIE & COEUR CHAIR', code: 'SSPC0202', article: 'COEUR FRAIS' },
  { categorie: 'BOULETTE', code: 'PEVC0702', article: 'BOULETTE FRAICHE' },
  { categorie: 'BOULETTE', code: 'PEVC0706', article: 'BOULETTE PANEE PRECUITE' },
  { categorie: 'BOULETTE', code: 'PEVC0705', article: 'BOULETTE FRAICHE AUX HERBES' },
  { categorie: 'BURGER', code: 'PEVC0801', article: 'BURGER' },
  { categorie: 'MORTADELLE', code: 'PEVC0403', article: 'MORTADELLE - Tranché' },
  { categorie: 'MORTADELLE', code: 'PEVC0402', article: 'MORTADELLE - NVP (Kely)' },
  { categorie: 'MORTADELLE', code: 'PEVC0401', article: 'MORTADELLE - Bloc 1Kg' },
  { categorie: 'MORTADELLE', code: 'PEVC1301', article: 'KITOZA POULET' },
  { categorie: 'MORTADELLE', code: 'PVEC1004', article: 'VIANDE HACHEE EPICEE' },
  { categorie: 'CERVELAS', code: 'PEVC0502', article: 'CERVELAS - NVP (Kely)' },
  { categorie: 'CERVELAS', code: 'PEVC0501', article: 'CERVELAS - Bloc 1Kg' },
  { categorie: 'CERVELAS', code: 'PEVC0503', article: 'CERVELAS - Tranché' },
  { categorie: 'CARCASSE CHAIR', code: 'SSPC0102', article: 'CARCASSE DE POULET DE CHAIR FRAIS' },
  { categorie: 'ABAT', code: 'SSPC0302', article: 'GESIER FRAIS' },
  { categorie: 'ABAT', code: 'PEVC0601', article: 'TERRINE BARQUETTE DE FOIE DE VOLAILLE' },
  { categorie: 'ABAT', code: 'PEVC0601A', article: 'TERRINE BLOC EN KG' },
  { categorie: 'SAUCISSE', code: 'PEVC0305', article: 'SAUCISSE AUX FINES HERBES' },
  { categorie: 'SAUCISSE', code: 'PEVC0307', article: 'SAUCISSE AUX HERBES FUMEE' },
  { categorie: 'SAUCISSE', code: 'PEVC0304', article: 'SAUCISSE FRANKFORT' },
  { categorie: 'SAUCISSE', code: 'PEVC0306', article: 'SAUCISSE AU MIEL' },
  { categorie: 'POULET DECOUPES', code: 'PLEC0102A', article: 'POULET DECOUPES' },
];

export const CATEGORY_COLORS: Record<string, string> = {
  'POULET ENTIER': '#F0997B',
  'TETE & PATTES CHAIR': '#5DCAA5',
  'FOIE & COEUR CHAIR': '#97C459',
  'BOULETTE': '#7F77DD',
  'BURGER': '#ED93B1',
  'MORTADELLE': '#85B7EB',
  'CERVELAS': '#EF9F27',
  'CARCASSE CHAIR': '#B4B2A9',
  'ABAT': '#D85A30',
  'SAUCISSE': '#1D9E75',
  'POULET DECOUPES': '#F0997B',
};

export const getCategories = (): string[] => {
  const seen = new Set<string>();
  const categories: string[] = [];
  for (const p of PRODUITS) {
    if (!seen.has(p.categorie)) {
      seen.add(p.categorie);
      categories.push(p.categorie);
    }
  }
  return categories;
};

export const getProduitsByCategorie = (categorie: string): Produit[] => {
  return PRODUITS.filter((p) => p.categorie === categorie);
};
