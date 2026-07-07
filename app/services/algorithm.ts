/**
 * Algorithme : quantiteCommande = (moyenneJournaliere × joursACouvrir × coefficientPeriode) - stockActuel + stockSecurite
 *
 * Livraison / approvisionnement uniquement les LUNDI, MERCREDI, VENDREDI.
 * La commande est passée le matin (avant 9h) pour une livraison FUTURE
 * (jamais le jour même — la livraison arrive entre 9h et 12h) :
 *   Mardi matin    → livraison mercredi
 *   Jeudi matin    → livraison vendredi
 *   Vendredi matin → livraison lundi   (on saute le week-end : pas de commande sam/dim)
 *
 * La cible est donc le prochain jour de livraison STRICTEMENT après aujourd'hui.
 *
 * Couverture (échoppe ouverte 7j/7, dimanche compris) :
 *   Livraison lundi    → couvre lun + mar (jusqu'au mer matin)        = 2 jours, ×1.0
 *   Livraison mercredi → couvre mer + jeu (jusqu'au ven matin)        = 2 jours, ×1.0
 *   Livraison vendredi → couvre ven + sam + dim (jusqu'au lun matin)  = 3 jours, ×1.5 (week-end)
 *   Veille de fête     → ×2.0
 *
 * (Un approvisionnement exceptionnel hors Lun/Mer/Ven reste possible mais rare.)
 */

// Jours de livraison : 1=lundi, 3=mercredi, 5=vendredi
const JOURS_LIVRAISON = [1, 3, 5];

function prochaineLivraison(date: Date): Date {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + 1); // strictement après aujourd'hui (commande pour une livraison future)
  while (!JOURS_LIVRAISON.includes(d.getDay())) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}

function livraisonSuivante(livraison: Date): Date {
  const d = new Date(livraison);
  d.setDate(d.getDate() + 1);
  while (!JOURS_LIVRAISON.includes(d.getDay())) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}

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
  const quantite = Math.max(0, Math.round((brut - stockActuel + stockSecurite) * 100) / 100);
  const arrondi = (n: number) => Math.round(n * 100) / 100;
  const formulaHint = `Moy/j ${arrondi(moyenneJournaliere)} · ×${coefficient} · ${joursACouvrir}j = ${arrondi(brut)} · −${arrondi(stockActuel)} stock`;
  return { quantite, formulaHint };
}

export interface PeriodeInfo {
  coefficient: number;
  joursACouvrir: number;
  label: string;
  dateLivraison: Date;
}

// Période calculée à partir du jour de COMMANDE (cas normal : on vise la
// prochaine livraison Lun/Mer/Ven strictement après aujourd'hui).
export function getPeriodeInfo(date: Date, veilleFete: boolean = false): PeriodeInfo {
  return getPeriodeInfoLivraison(prochaineLivraison(date), veilleFete);
}

// Période calculée à partir d'une date de LIVRAISON choisie.
// Sert au sélecteur de date sur l'écran Commande (approvisionnement exceptionnel
// possible n'importe quel jour). La couverture va jusqu'à la prochaine livraison
// régulière Lun/Mer/Ven ; le coefficient passe en ×1.5 si la période inclut un
// samedi ou un dimanche (demande week-end plus forte).
export function getPeriodeInfoLivraison(livraison: Date, veilleFete: boolean = false): PeriodeInfo {
  const liv = new Date(livraison);
  liv.setHours(12, 0, 0, 0);

  const suivante = livraisonSuivante(liv);
  const joursACouvrir = Math.max(1, Math.round((suivante.getTime() - liv.getTime()) / 86400000));

  // Week-end couvert ? (un des jours de la période est un samedi ou un dimanche)
  let couvreWeekend = false;
  const cur = new Date(liv);
  for (let i = 0; i < joursACouvrir; i++) {
    const dow = cur.getDay();
    if (dow === 0 || dow === 6) {
      couvreWeekend = true;
      break;
    }
    cur.setDate(cur.getDate() + 1);
  }

  let coefficient = couvreWeekend ? 1.5 : 1.0;
  let label = couvreWeekend ? 'Week-end ×1.5' : 'Standard ×1.0';

  if (veilleFete) {
    coefficient = 2.0;
    label = 'Veille fête ×2.0';
  }

  return { coefficient, joursACouvrir, label, dateLivraison: liv };
}

// Jour de livraison régulier précédent (Lun/Mer/Ven) strictement avant la date donnée.
export function livraisonPrecedente(livraison: Date): Date {
  const d = new Date(livraison);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - 1);
  while (!JOURS_LIVRAISON.includes(d.getDay())) {
    d.setDate(d.getDate() - 1);
  }
  return d;
}

// Jour de livraison régulier suivant (Lun/Mer/Ven) strictement après la date donnée. Exporté pour l'UI.
export function livraisonSuivanteReguliere(livraison: Date): Date {
  return livraisonSuivante(livraison);
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
