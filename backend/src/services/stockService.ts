import { PrismaClient, Produit, StockEntree } from '@prisma/client';
import { mettreAJourMoyenne } from './algorithmService';

const prisma = new PrismaClient();

type ProduitAvecStock = Produit & { stockEntrees: StockEntree[] };

export async function sauvegarderStock(entrees: { produitId: number; quantite: number }[]) {
  const result = await prisma.$transaction(
    entrees.map((e) => prisma.stockEntree.create({ data: { produitId: e.produitId, quantite: e.quantite } }))
  );
  await Promise.all(entrees.map((e) => mettreAJourMoyenne(e.produitId)));
  return result;
}

export async function getDernierStock() {
  const produits: ProduitAvecStock[] = await prisma.produit.findMany({
    include: { stockEntrees: { orderBy: { date: 'desc' }, take: 1 } },
    orderBy: { categorie: 'asc' },
  });
  return produits.map((p: ProduitAvecStock) => ({
    id: p.id,
    code: p.code,
    article: p.article,
    categorie: p.categorie,
    moyenneJour: p.moyenneJour,
    stockSecurite: p.stockSecurite,
    dernierStock: p.stockEntrees[0]?.quantite ?? null,
    dateDernierStock: p.stockEntrees[0]?.date ?? null,
  }));
}

export async function getHistoriqueStock() {
  const entrees = await prisma.stockEntree.findMany({
    include: { produit: true },
    orderBy: { date: 'desc' },
  });

  // Regroupement par jour calendaire
  const parJour = new Map<
    string,
    { date: string; total: number; lignes: { code: string; article: string; categorie: string; quantite: number; heure: string }[] }
  >();

  for (const e of entrees) {
    const jour = e.date.toISOString().slice(0, 10); // YYYY-MM-DD
    if (!parJour.has(jour)) {
      parJour.set(jour, { date: jour, total: 0, lignes: [] });
    }
    const groupe = parJour.get(jour)!;
    groupe.total += e.quantite;
    groupe.lignes.push({
      code: e.produit.code,
      article: e.produit.article,
      categorie: e.produit.categorie,
      quantite: e.quantite,
      heure: e.date.toISOString(),
    });
  }

  return Array.from(parJour.values());
}

export async function getStockCritique() {
  const produits: ProduitAvecStock[] = await prisma.produit.findMany({
    include: { stockEntrees: { orderBy: { date: 'desc' }, take: 1 } },
  });
  return produits.filter((p: ProduitAvecStock) => {
    const stock = p.stockEntrees[0]?.quantite ?? 0;
    return stock <= p.stockSecurite && p.stockSecurite > 0;
  });
}
