import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/ventes', async (_req: Request, res: Response) => {
  try {
    const sept = new Date();
    sept.setDate(sept.getDate() - 7);

    const commandes = await prisma.commande.findMany({
      where: { dateCommande: { gte: sept } },
      orderBy: { dateCommande: 'asc' },
      select: { dateCommande: true, totalUnites: true },
    });

    const jours = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const venteParJour: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      venteParJour[key] = 0;
    }

    for (const c of commandes) {
      const key = c.dateCommande.toISOString().split('T')[0];
      if (key in venteParJour) venteParJour[key] += c.totalUnites;
    }

    const data = Object.entries(venteParJour).map(([date, total]) => {
      const d = new Date(date);
      return { date, jour: jours[d.getDay()], totalUnites: total };
    });

    res.json(data);
  } catch (e) {
    res.status(500).json({ erreur: 'Erreur lors de la récupération des ventes' });
  }
});

router.get('/rotation', async (_req: Request, res: Response) => {
  try {
    const produits = await prisma.produit.findMany({
      include: { stockEntrees: { orderBy: { date: 'desc' }, take: 7 } },
      orderBy: { moyenneJour: 'desc' },
    });

    const rotations = produits.map((p) => {
      const entrees = p.stockEntrees;
      let tauxRotation = 0;
      if (entrees.length >= 2) {
        const initial = entrees[entrees.length - 1].quantite;
        const final_ = entrees[0].quantite;
        tauxRotation = initial > 0 ? Math.round(((initial - final_) / initial) * 100) : 0;
      }
      return { id: p.id, code: p.code, article: p.article, categorie: p.categorie, moyenneJour: p.moyenneJour, tauxRotation };
    });

    res.json(rotations);
  } catch (e) {
    res.status(500).json({ erreur: 'Erreur lors du calcul du taux de rotation' });
  }
});

router.get('/dashboard', async (_req: Request, res: Response) => {
  try {
    const produits = await prisma.produit.findMany({
      include: { stockEntrees: { orderBy: { date: 'desc' }, take: 7 } },
    });

    const totalArticles = produits.length;
    let articlesEnStock = 0;
    let stockCritique = 0;
    let totalRotation = 0;
    let nbRotation = 0;

    for (const p of produits) {
      const dernier = p.stockEntrees[0]?.quantite;
      if (dernier !== undefined && dernier > 0) articlesEnStock++;
      if (dernier !== undefined && p.stockSecurite > 0 && dernier <= p.stockSecurite) stockCritique++;
      if (p.stockEntrees.length >= 2) {
        const initial = p.stockEntrees[p.stockEntrees.length - 1].quantite;
        const final_ = p.stockEntrees[0].quantite;
        if (initial > 0) {
          totalRotation += Math.max(0, Math.round(((initial - final_) / initial) * 100));
          nbRotation++;
        }
      }
    }

    const derniere = await prisma.commande.findFirst({
      orderBy: { dateCommande: 'desc' },
      select: { dateCommande: true, totalUnites: true },
    });

    res.json({
      articlesEnStock,
      totalArticles,
      rotationMoyenne: nbRotation > 0 ? Math.round(totalRotation / nbRotation) : 0,
      stockCritique,
      derniereCommande: derniere?.dateCommande ?? null,
      derniereCommandeTotal: derniere?.totalUnites ?? null,
    });
  } catch (e) {
    res.status(500).json({ erreur: 'Erreur lors du calcul du tableau de bord' });
  }
});

router.get('/fetes', async (_req: Request, res: Response) => {
  try {
    const fetes = await prisma.jourFerie.findMany({
      where: { date: { gte: new Date() } },
      orderBy: { date: 'asc' },
      take: 10,
    });
    res.json(fetes);
  } catch (e) {
    res.status(500).json({ erreur: 'Erreur lors de la récupération des fêtes' });
  }
});

router.post('/fetes', async (req: Request, res: Response) => {
  try {
    const { date, description, coefficient } = req.body;
    const fete = await prisma.jourFerie.create({ data: { date: new Date(date), description, coefficient: coefficient ?? 2.0 } });
    res.json(fete);
  } catch (e) {
    res.status(500).json({ erreur: 'Erreur lors de la création du jour férié' });
  }
});

export default router;
