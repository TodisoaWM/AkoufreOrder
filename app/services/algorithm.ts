/**
 * Algorithm: quantiteCommande = (moyenneJournaliere × joursACouvrir × coefficientPeriode) - stockActuel + stockSecurite
 *
 * Coefficients:
 *   Mardi/Jeudi → ×1.0 (1 jour)
 *   Vendredi   → ×1.5 (3 jours: ven+sam+dim+lun)
 *   Veille fête → ×2.0
 */

export interface AlgorithmInput {
  moyenneJournaliere: number;
  stockActuel: number;
  stockSecurite: number;
  coefficient: number;
  joursACouvrir: number;
}

export interface AlgorithmResult {
  quantite: number;
  formulaHint: string;
}

export function calculerQuantite(input: AlgorithmInput): AlgorithmResult {
  const { moyenneJournaliere, stockActuel, stockSecurite, coefficient, joursACouvrir } = input;
  const brut = moyenneJournaliere * joursACouvrir * coefficient;
  const quantite = Math.max(0, Math.round(brut - stockActuel + stockSecurite));
  const formulaHint = `Moy/j ${Math.round(moyenneJournaliere)} · ×${coefficient} = ${Math.round(brut)} · −${stockActuel} stock`;
  return { quantite, formulaHint };
}

export interface PeriodeInfo {
  coefficient: number;
  joursACouvrir: number;
  label: string;
  dateLivraison: Date;
}

export function getPeriodeInfo(date: Date, veilleFete: boolean = false): PeriodeInfo {
  if (veilleFete) {
    const livraison = new Date(date);
    livraison.setDate(livraison.getDate() + 1);
    return {
      coefficient: 2.0,
      joursACouvrir: 1,
      label: 'Veille fête ×2.0',
      dateLivraison: livraison,
    };
  }

  const dayOfWeek = date.getDay(); // 0=dim, 1=lun, 2=mar, 3=mer, 4=jeu, 5=ven, 6=sam

  if (dayOfWeek === 5) {
    // Vendredi: couvre ven+sam+dim+lun = 4 jours, coeff ×1.5
    const livraison = new Date(date);
    livraison.setDate(livraison.getDate() + 3); // livraison lundi
    return {
      coefficient: 1.5,
      joursACouvrir: 4,
      label: 'Week-end ×1.5',
      dateLivraison: livraison,
    };
  }

  // Mardi ou Jeudi (jours de commande standards)
  const livraison = new Date(date);
  livraison.setDate(livraison.getDate() + 1);
  return {
    coefficient: 1.0,
    joursACouvrir: 1,
    label: 'Standard ×1.0',
    dateLivraison: livraison,
  };
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('fr-MG', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  });
}

export function formatDateLong(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
