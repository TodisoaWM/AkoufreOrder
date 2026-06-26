import { Router, Request, Response } from 'express';
import { sauvegarderCommande, getHistorique, getCommandeDetail, mettreAJourStatut } from '../services/commandeService';
import { calculerSuggestion } from '../services/algorithmService';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const historique = await getHistorique();
    res.json(historique);
  } catch (e) {
    res.status(500).json({ erreur: 'Erreur lors de la récupération de l\'historique' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const commande = await getCommandeDetail(Number(req.params.id));
    if (!commande) return res.status(404).json({ erreur: 'Commande introuvable' });
    res.json(commande);
  } catch (e) {
    res.status(500).json({ erreur: 'Erreur lors de la récupération de la commande' });
  }
});

router.post('/calculer', async (req: Request, res: Response) => {
  try {
    const dateCommande = req.body.date ? new Date(req.body.date) : new Date();
    const suggestion = await calculerSuggestion(dateCommande);
    res.json(suggestion);
  } catch (e) {
    res.status(500).json({ erreur: 'Erreur lors du calcul de la suggestion' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { dateLivraison, coefficient, lignes } = req.body;
    if (!dateLivraison || !lignes || !Array.isArray(lignes)) {
      return res.status(400).json({ erreur: 'Données invalides' });
    }
    const commande = await sauvegarderCommande({ dateLivraison, coefficient, lignes });
    res.json(commande);
  } catch (e) {
    res.status(500).json({ erreur: 'Erreur lors de la sauvegarde de la commande' });
  }
});

router.patch('/:id/statut', async (req: Request, res: Response) => {
  try {
    const { statut } = req.body as { statut: string };
    const valides = ['Soumis', 'Modifiée', 'Manqué'];
    if (!valides.includes(statut)) return res.status(400).json({ erreur: 'Statut invalide' });
    const commande = await mettreAJourStatut(Number(req.params.id), statut);
    res.json(commande);
  } catch (e) {
    res.status(500).json({ erreur: 'Erreur lors de la mise à jour du statut' });
  }
});

export default router;
