// Règles métier d'ajustement des quantités de commande, par produit.
// Appliquées APRÈS le calcul algorithmique (moyenne hybride), pour coller au
// fonctionnement réel de l'échoppe.

// Produits qu'on ne commande presque jamais → suggestion forcée à 0
// (le champ reste modifiable manuellement au cas où).
export const PRODUITS_EXCLUS = new Set<string>([
  'PEVC0705', // BOULETTE FRAICHE AUX HERBES
  'PEVC0403', // MORTADELLE - Tranché
  'PEVC0402', // MORTADELLE - NVP (Kely)
  'PEVC1301', // KITOZA POULET
  'PVEC1004', // VIANDE HACHEE EPICEE
  'PEVC0502', // CERVELAS - NVP (Kely)
  'PEVC0503', // CERVELAS - Tranché
  'PEVC0601', // TERRINE BARQUETTE DE FOIE DE VOLAILLE
  'PEVC0306', // SAUCISSE AU MIEL
  'PLEC0102A', // POULET DECOUPES
]);

// Plafonds : la commande ne dépasse jamais cette valeur (kg).
export const PLAFONDS: Record<string, number> = {
  'PEVC0706': 3, // BOULETTE PANEE PRECUITE
  'PEVC0702': 10, // BOULETTE FRAICHE
  'PEVC0801': 8, // BURGER
  'PEVC0401': 2, // MORTADELLE - Bloc 1Kg
  'PEVC0501': 2, // CERVELAS - Bloc 1Kg
  'SSPC0302': 8, // GESIER FRAIS
  'PEVC0601A': 1.5, // TERRINE BLOC EN KG
  'PEVC0305': 3, // SAUCISSE AUX FINES HERBES (et 0 si stock restant < 1 kg)
  'PEVC0307': 3, // SAUCISSE AUX HERBES FUMEE
  'PEVC0304': 3, // SAUCISSE FRANKFORT
  'SSPC0402A': 20, // PATTES FRAIS
  'SSPC0402': 20, // TETE
};

// Planchers : la commande est toujours au moins cette valeur (kg).
export const PLANCHERS: Record<string, number> = {
  'SSPC0102': 80, // CARCASSE DE POULET DE CHAIR FRAIS — toujours le max, min 80 kg
};

const SAUCISSE_FINES_HERBES = 'PEVC0305'; // si stock restant < 1 kg → on ne commande pas (périssable)
const PATTES = 'SSPC0402A';
const TETE = 'SSPC0402';

const arrondi = (n: number) => Math.round(n * 100) / 100;

export interface LigneAjustable {
  code: string;
  quantite: number;
  stockActuel: number;
}

// Applique toutes les règles métier sur les lignes (mute quantite). Retourne les lignes.
export function appliquerRegles<T extends LigneAjustable>(lignes: T[]): T[] {
  for (const l of lignes) {
    // Produits exclus → 0
    if (PRODUITS_EXCLUS.has(l.code)) {
      l.quantite = 0;
      continue;
    }
    // Saucisse aux fines herbes : périssable, si stock restant < 1 kg → 0
    if (l.code === SAUCISSE_FINES_HERBES && l.stockActuel < 1) {
      l.quantite = 0;
      continue;
    }
    // Plancher (min)
    if (PLANCHERS[l.code] !== undefined) {
      l.quantite = Math.max(l.quantite, PLANCHERS[l.code]);
    }
    // Plafond (max)
    if (PLAFONDS[l.code] !== undefined) {
      l.quantite = Math.min(l.quantite, PLAFONDS[l.code]);
    }
    l.quantite = arrondi(Math.max(0, l.quantite));
  }

  // TÊTE = toujours la moitié de la quantité de PATTES (après plafonds)
  const pattes = lignes.find((l) => l.code === PATTES);
  const tete = lignes.find((l) => l.code === TETE);
  if (pattes && tete) {
    let q = pattes.quantite / 2;
    if (PLAFONDS[TETE] !== undefined) q = Math.min(q, PLAFONDS[TETE]);
    tete.quantite = arrondi(Math.max(0, q));
  }

  return lignes;
}
