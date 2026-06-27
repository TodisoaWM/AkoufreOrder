import { PrismaClient } from '@prisma/client';
import { appliquerRegles } from './reglesProduits';

const prisma = new PrismaClient();

// Livraison uniquement les LUNDI(1), MERCREDI(3), VENDREDI(5).
// Commande passée le matin pour une livraison future (jamais le jour même) :
//   mardi→mer, jeudi→ven, vendredi→lun (on saute le week-end).
// Cible = prochain jour de livraison strictement après aujourd'hui.
// Couverture : lundi=2j ×1.0, mercredi=2j ×1.0, vendredi=3j ×1.5 (week-end).
const JOURS_LIVRAISON = [1, 3, 5];

function prochaineLivraison(date: Date): Date {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + 1); // strictement après aujourd'hui
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

export function getCoefficientJour(date: Date): {
  coefficient: number;
  joursACouvrir: number;
  label: string;
  dateLivraison: Date;
} {
  const livraison = prochaineLivraison(date);
  const suivante = livraisonSuivante(livraison);
  const joursACouvrir = Math.round((suivante.getTime() - livraison.getTime()) / 86400000);
  const couvreWeekend = livraison.getDay() === 5;
  return {
    coefficient: couvreWeekend ? 1.5 : 1.0,
    joursACouvrir,
    label: couvreWeekend ? 'Week-end ×1.5' : 'Standard ×1.0',
    dateLivraison: livraison,
  };
}

// Couverture calculée directement à partir d'une DATE DE LIVRAISON choisie
// (utilisé par le sélecteur de l'écran Commande). Coefficient ×1.5 si la
// période couverte inclut un samedi ou un dimanche.
export function getInfoFromLivraison(livraison: Date): {
  coefficient: number;
  joursACouvrir: number;
  label: string;
  dateLivraison: Date;
} {
  const liv = new Date(livraison);
  liv.setHours(12, 0, 0, 0);
  const suivante = livraisonSuivante(liv);
  const joursACouvrir = Math.max(1, Math.round((suivante.getTime() - liv.getTime()) / 86400000));

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
  return {
    coefficient: couvreWeekend ? 1.5 : 1.0,
    joursACouvrir,
    label: couvreWeekend ? 'Week-end ×1.5' : 'Standard ×1.0',
    dateLivraison: liv,
  };
}

async function getInfoAvecFetes(livraison: Date) {
  const base = getInfoFromLivraison(livraison);
  const fin = new Date(base.dateLivraison);
  fin.setDate(fin.getDate() + base.joursACouvrir);
  const fete = await prisma.jourFerie.findFirst({
    where: { date: { gte: base.dateLivraison, lt: fin } },
  });
  if (fete) {
    return { ...base, coefficient: Math.max(fete.coefficient, base.coefficient), label: `Fête ×${fete.coefficient}` };
  }
  return base;
}

// Conservé pour compat : coefficient à partir d'un jour de COMMANDE.
export async function getCoefficientAvecFetes(date: Date) {
  return getInfoAvecFetes(prochaineLivraison(date));
}

// Moyenne de vente/jour HISTORIQUE, en tenant compte des livraisons.
// Entre deux pesées de fin de journée, du stock a été ajouté par la livraison ;
//   ventes = stock_veille + livraisons_de_la_période − stock_du_soir.
function calculerMoyenneHistorique(
  pesees: { date: Date; quantite: number }[], // triées par date croissante
  livraisons: { date: Date; quantite: number }[]
): { moyenne: number; intervalles: number } {
  let totalVentes = 0;
  let totalJours = 0;
  let intervalles = 0;

  for (let i = 0; i < pesees.length - 1; i++) {
    const debut = pesees[i].date;
    const fin = pesees[i + 1].date;
    const livreEntre = livraisons
      .filter((l) => l.date > debut && l.date <= fin)
      .reduce((s, l) => s + l.quantite, 0);
    const ventes = pesees[i].quantite + livreEntre - pesees[i + 1].quantite;
    const jours = Math.max(1, Math.round((fin.getTime() - debut.getTime()) / 86400000));
    if (ventes >= 0) {
      totalVentes += ventes;
      totalJours += jours;
      intervalles++;
    }
  }

  return { moyenne: totalJours > 0 ? totalVentes / totalJours : 0, intervalles };
}

// dateLivraison : la livraison ciblée. Par défaut, la prochaine livraison régulière.
export async function calculerSuggestion(dateLivraison?: Date) {
  const cible = dateLivraison ?? prochaineLivraison(new Date());
  const { coefficient, joursACouvrir, label, dateLivraison: liv } = await getInfoAvecFetes(cible);

  const produits = await prisma.produit.findMany({
    include: { stockEntrees: { orderBy: { date: 'desc' }, take: 30 } },
  });

  // Livraisons historiques (quantités commandées) par produit
  const lignesCmd = await prisma.ligneCommande.findMany({
    include: { commande: { select: { dateLivraison: true } } },
  });
  const livraisonsParProduit = new Map<number, { date: Date; quantite: number }[]>();
  for (const l of lignesCmd) {
    const arr = livraisonsParProduit.get(l.produitId) ?? [];
    arr.push({ date: l.commande.dateLivraison, quantite: l.quantite });
    livraisonsParProduit.set(l.produitId, arr);
  }

  const lignes = produits.map((p) => {
    const stockActuel = p.stockEntrees[0]?.quantite ?? 0;

    // Référence manuelle (stable)
    const reference = p.moyenneJour;
    // Historique (pesées triées croissant) ajusté des livraisons
    const pesees = [...p.stockEntrees].reverse();
    const { moyenne: hist, intervalles } = calculerMoyenneHistorique(
      pesees,
      livraisonsParProduit.get(p.id) ?? []
    );
    // Hybride : on mélange dès qu'on a au moins 2 intervalles fiables
    const moyenneEffective = intervalles >= 2 ? 0.5 * reference + 0.5 * hist : reference;

    // Stock de sécurité proportionnel : ≈ 1/4 d'une journée de vente
    const securite = Math.max(0.5, Math.round(moyenneEffective * 0.25 * 100) / 100);

    const brut = moyenneEffective * joursACouvrir * coefficient - stockActuel + securite;
    const quantite = Math.max(0, Math.round(brut * 100) / 100);

    return {
      produitId: p.id,
      code: p.code,
      article: p.article,
      categorie: p.categorie,
      quantite,
      stockActuel,
      moyenneJour: Math.round(moyenneEffective * 100) / 100,
      stockSecurite: securite,
      coefficient,
    };
  });

  // Application des règles métier par produit (exclusions, plafonds, plancher, TÊTE = ½ PATTES…)
  appliquerRegles(lignes);

  const totalUnites = Math.round(lignes.reduce((s, l) => s + l.quantite, 0) * 100) / 100;
  return { lignes, totalUnites, coefficient, joursACouvrir, label, dateLivraison: liv.toISOString() };
}

// Conservé pour compat mais NE MET PLUS À JOUR la référence manuelle :
// la moyenne effective est désormais calculée à la volée (hybride) dans calculerSuggestion.
export async function mettreAJourMoyenne(_produitId: number) {
  return;
}
