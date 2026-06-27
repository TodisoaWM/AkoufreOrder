import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Livraison uniquement les LUNDI(1), MERCREDI(3), VENDREDI(5).
// Lundi/mercredi couvrent 2 jours ; vendredi couvre le week-end (ven+sam+dim = 3 jours, ×1.5).
const JOURS_LIVRAISON = [1, 3, 5];

function prochaineLivraison(date: Date): Date {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
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

export async function getCoefficientAvecFetes(date: Date) {
  const base = getCoefficientJour(date);

  // Une fête tombant dans la période couverte par la livraison → coefficient majoré
  const fin = new Date(base.dateLivraison);
  fin.setDate(fin.getDate() + base.joursACouvrir);
  const fete = await prisma.jourFerie.findFirst({
    where: { date: { gte: base.dateLivraison, lt: fin } },
  });
  if (fete) {
    return {
      coefficient: Math.max(fete.coefficient, base.coefficient),
      joursACouvrir: base.joursACouvrir,
      label: `Fête ×${fete.coefficient}`,
      dateLivraison: base.dateLivraison,
    };
  }
  return base;
}

export async function calculerSuggestion(dateCommande: Date = new Date()) {
  const { coefficient, joursACouvrir, label } = await getCoefficientAvecFetes(dateCommande);

  const produits = await prisma.produit.findMany({ include: { stockEntrees: { orderBy: { date: 'desc' }, take: 1 } } });

  const lignes = produits.map((p) => {
    const stockActuel = p.stockEntrees[0]?.quantite ?? 0;
    const brut = p.moyenneJour * joursACouvrir * coefficient - stockActuel + p.stockSecurite;
    const quantite = Math.max(0, Math.round(brut * 100) / 100);
    return { produitId: p.id, code: p.code, article: p.article, categorie: p.categorie, quantite, stockActuel, moyenneJour: p.moyenneJour, coefficient };
  });

  const totalUnites = lignes.reduce((s, l) => s + l.quantite, 0);
  return { lignes, totalUnites, coefficient, joursACouvrir, label };
}

export async function mettreAJourMoyenne(produitId: number) {
  const entrees = await prisma.stockEntree.findMany({ where: { produitId }, orderBy: { date: 'desc' }, take: 14 });
  if (entrees.length < 2) return;

  let totalConsommation = 0;
  for (let i = 0; i < entrees.length - 1; i++) {
    const consommation = entrees[i + 1].quantite - entrees[i].quantite;
    if (consommation > 0) totalConsommation += consommation;
  }
  const moyenne = Math.round((totalConsommation / (entrees.length - 1)) * 100) / 100;

  await prisma.produit.update({ where: { id: produitId }, data: { moyenneJour: moyenne } });
}
