import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const COMMANDE_JSON = path.resolve(__dirname, '../../commande.json');

export async function sauvegarderCommande(data: {
  dateLivraison: string;
  coefficient: number;
  lignes: { produitId: number; quantite: number; stock: number }[];
}) {
  const totalUnites = data.lignes.reduce((s, l) => s + l.quantite, 0);

  const commande = await prisma.commande.create({
    data: {
      dateLivraison: new Date(data.dateLivraison),
      coefficient: data.coefficient,
      totalUnites,
      lignes: { create: data.lignes.map((l) => ({ produitId: l.produitId, quantite: l.quantite, stock: l.stock })) },
    },
    include: { lignes: { include: { produit: true } } },
  });

  const commandeJson = {
    id: commande.id,
    dateCommande: commande.dateCommande,
    dateLivraison: commande.dateLivraison,
    coefficient: commande.coefficient,
    totalUnites: commande.totalUnites,
    lignes: commande.lignes.map((l) => ({
      code: l.produit.code,
      article: l.produit.article,
      categorie: l.produit.categorie,
      quantite: l.quantite,
    })),
  };
  fs.writeFileSync(COMMANDE_JSON, JSON.stringify(commandeJson, null, 2), 'utf-8');

  return commande;
}

export async function getHistorique() {
  return prisma.commande.findMany({
    orderBy: { dateCommande: 'desc' },
    include: { lignes: { include: { produit: true } } },
  });
}

export async function getCommandeDetail(id: number) {
  return prisma.commande.findUnique({ where: { id }, include: { lignes: { include: { produit: true } } } });
}

export async function mettreAJourStatut(id: number, statut: string) {
  return prisma.commande.update({ where: { id }, data: { statut } });
}
