import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type JourCommande = 'mardi' | 'jeudi' | 'vendredi';

export function getCoefficientJour(date: Date): { coefficient: number; joursACouvrir: number; label: string } {
  const jour = date.getDay();
  if (jour === 5) return { coefficient: 1.5, joursACouvrir: 3, label: 'Week-end ×1.5' };
  return { coefficient: 1.0, joursACouvrir: 1, label: 'Jour normal' };
}

export async function getCoefficientAvecFetes(date: Date) {
  const debut = new Date(date);
  debut.setHours(0, 0, 0, 0);
  const fin = new Date(date);
  fin.setHours(23, 59, 59, 999);

  const fete = await prisma.jourFerie.findFirst({ where: { date: { gte: debut, lte: fin } } });
  if (fete) return { coefficient: fete.coefficient, joursACouvrir: 2, label: `Fête ×${fete.coefficient}` };
  return getCoefficientJour(date);
}

export async function calculerSuggestion(dateCommande: Date = new Date()) {
  const { coefficient, joursACouvrir, label } = await getCoefficientAvecFetes(dateCommande);

  const produits = await prisma.produit.findMany({ include: { stockEntrees: { orderBy: { date: 'desc' }, take: 1 } } });

  const lignes = produits.map((p) => {
    const stockActuel = p.stockEntrees[0]?.quantite ?? 0;
    const brut = Math.ceil(p.moyenneJour * joursACouvrir * coefficient) - stockActuel + p.stockSecurite;
    const quantite = Math.max(0, brut);
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
  const moyenne = Math.round(totalConsommation / (entrees.length - 1));

  await prisma.produit.update({ where: { id: produitId }, data: { moyenneJour: moyenne } });
}
