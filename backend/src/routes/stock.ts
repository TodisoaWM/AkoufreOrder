import { Router, Request, Response } from 'express';
import { getDernierStock, sauvegarderStock, getStockCritique, getHistoriqueStock } from '../services/stockService';

const router = Router();

router.get('/dernier', async (_req: Request, res: Response) => {
  try {
    const stock = await getDernierStock();
    res.json(stock);
  } catch (e) {
    res.status(500).json({ erreur: 'Erreur lors de la récupération du stock' });
  }
});

router.get('/historique', async (_req: Request, res: Response) => {
  try {
    const historique = await getHistoriqueStock();
    res.json(historique);
  } catch (e) {
    res.status(500).json({ erreur: 'Erreur lors de la récupération de l\'historique du stock' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { entrees } = req.body as {
      entrees: { produitCode: string; quantite: number; date?: string }[];
    };
    if (!Array.isArray(entrees) || entrees.length === 0) {
      return res.status(400).json({ erreur: 'Données invalides' });
    }
    const result = await sauvegarderStock(entrees);
    res.json({ succes: true, count: result.length });
  } catch (e) {
    res.status(500).json({ erreur: 'Erreur lors de la sauvegarde du stock' });
  }
});

router.get('/critique', async (_req: Request, res: Response) => {
  try {
    const critique = await getStockCritique();
    res.json(critique);
  } catch (e) {
    res.status(500).json({ erreur: 'Erreur lors de la récupération des stocks critiques' });
  }
});

export default router;
