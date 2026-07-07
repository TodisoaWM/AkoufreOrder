import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const produits = [
  { code: 'PLEC0104',  article: 'POULET ENTIER AKOUFRE',                    categorie: 'POULET ENTIER',       moyenneJour: 50, stockSecurite: 5 },
  { code: 'SSPC0402A', article: 'PATTES FRAIS',                              categorie: 'TETE & PATTES CHAIR', moyenneJour: 30, stockSecurite: 3 },
  { code: 'SSPC0402',  article: 'TETE',                                      categorie: 'TETE & PATTES CHAIR', moyenneJour: 25, stockSecurite: 3 },
  { code: 'SSPC0202A', article: 'FOIE',                                      categorie: 'FOIE & COEUR CHAIR',  moyenneJour: 20, stockSecurite: 2 },
  { code: 'SSPC0202',  article: 'COEUR FRAIS',                               categorie: 'FOIE & COEUR CHAIR',  moyenneJour: 15, stockSecurite: 2 },
  { code: 'PEVC0702',  article: 'BOULETTE FRAICHE',                          categorie: 'BOULETTE',            moyenneJour: 40, stockSecurite: 4 },
  { code: 'PEVC0706',  article: 'BOULETTE PANEE PRECUITE',                   categorie: 'BOULETTE',            moyenneJour: 20, stockSecurite: 2 },
  { code: 'PEVC0705',  article: 'BOULETTE FRAICHE AUX HERBES',               categorie: 'BOULETTE',            moyenneJour: 15, stockSecurite: 2 },
  { code: 'PEVC0801',  article: 'BURGER',                                    categorie: 'BURGER',              moyenneJour: 25, stockSecurite: 3 },
  { code: 'PEVC0403',  article: 'MORTADELLE - Tranché',                      categorie: 'MORTADELLE',          moyenneJour: 10, stockSecurite: 1 },
  { code: 'PEVC0402',  article: 'MORTADELLE - NVP (Kely)',                   categorie: 'MORTADELLE',          moyenneJour: 12, stockSecurite: 1 },
  { code: 'PEVC0401',  article: 'MORTADELLE - Bloc 1Kg',                     categorie: 'MORTADELLE',          moyenneJour: 8,  stockSecurite: 1 },
  { code: 'PEVC1301',  article: 'KITOZA POULET',                             categorie: 'MORTADELLE',          moyenneJour: 5,  stockSecurite: 1 },
  { code: 'PVEC1004',  article: 'VIANDE HACHEE EPICEE',                      categorie: 'MORTADELLE',          moyenneJour: 7,  stockSecurite: 1 },
  { code: 'PEVC0502',  article: 'CERVELAS - NVP (Kely)',                     categorie: 'CERVELAS',            moyenneJour: 15, stockSecurite: 2 },
  { code: 'PEVC0501',  article: 'CERVELAS - Bloc 1Kg',                       categorie: 'CERVELAS',            moyenneJour: 10, stockSecurite: 1 },
  { code: 'PEVC0503',  article: 'CERVELAS - Tranché',                        categorie: 'CERVELAS',            moyenneJour: 12, stockSecurite: 1 },
  { code: 'SSPC0102',  article: 'CARCASSE DE POULET DE CHAIR FRAIS',         categorie: 'CARCASSE CHAIR',      moyenneJour: 20, stockSecurite: 2 },
  { code: 'SSPC0302',  article: 'GESIER FRAIS',                              categorie: 'ABAT',                moyenneJour: 18, stockSecurite: 2 },
  { code: 'PEVC0601',  article: 'TERRINE BARQUETTE DE FOIE DE VOLAILLE',     categorie: 'ABAT',                moyenneJour: 8,  stockSecurite: 1 },
  { code: 'PEVC0601A', article: 'TERRINE BLOC EN KG',                        categorie: 'ABAT',                moyenneJour: 5,  stockSecurite: 1 },
  { code: 'PEVC0305',  article: 'SAUCISSE AUX FINES HERBES',                 categorie: 'SAUCISSE',            moyenneJour: 20, stockSecurite: 2 },
  { code: 'PEVC0307',  article: 'SAUCISSE AUX HERBES FUMEE',                 categorie: 'SAUCISSE',            moyenneJour: 15, stockSecurite: 2 },
  { code: 'PEVC0304',  article: 'SAUCISSE FRANKFORT',                        categorie: 'SAUCISSE',            moyenneJour: 18, stockSecurite: 2 },
  { code: 'PEVC0306',  article: 'SAUCISSE AU MIEL',                          categorie: 'SAUCISSE',            moyenneJour: 12, stockSecurite: 1 },
  { code: 'PLEC0102A', article: 'POULET DECOUPES',                           categorie: 'POULET DECOUPES',     moyenneJour: 35, stockSecurite: 4 },
];

async function main() {
  console.log('Initialisation du catalogue produits...');
  for (const p of produits) {
    await prisma.produit.upsert({ where: { code: p.code }, update: p, create: p });
  }
  console.log(`${produits.length} produits initialisés.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
