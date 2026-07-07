import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import stockRoutes from './routes/stock';
import commandeRoutes from './routes/commande';
import statsRoutes from './routes/stats';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(cors());
app.use(express.json());

app.use('/api/stock', stockRoutes);
app.use('/api/commande', commandeRoutes);
app.use('/api/stats', statsRoutes);

app.get('/api/sante', (_req, res) => res.json({ statut: 'ok', timestamp: new Date().toISOString() }));

app.listen(PORT, () => {
  console.log(`Serveur AkoufréOrder démarré sur le port ${PORT}`);
});
