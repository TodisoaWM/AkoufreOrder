# AkoufréOrder

Application mobile pour automatiser les commandes journalières sur **AkoufréNET** (Eclosia Madagascar).

**Franchisé :** Akoufré Ambanidia — Echoppe

---

## Stack technique

| Couche | Technologie |
|---|---|
| App mobile | React Native Expo + TypeScript |
| Backend local | Node.js + Express + TypeScript |
| Base de données | SQLite via Prisma |
| Automatisation | Python + Playwright |

---

## Démarrage rapide

### 1. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Le serveur démarre sur `http://localhost:3000`.

### 2. App mobile

```bash
cd app
npm install
npx expo start
```

### 3. Script Playwright (Windows)

```bash
cd playwright
pip install -r requirements.txt
playwright install chromium
cp .env.example .env
# Remplir .env avec vos identifiants AkoufréNET
python auto_commande.py
```

---

## Jours de commande

| Jour commande | Livraison | Coefficient |
|---|---|---|
| Mardi | Mercredi | ×1.0 |
| Jeudi | Vendredi | ×1.0 |
| Vendredi | Lundi | ×1.5 (week-end) |
| Veille fête | +1 jour | ×2.0 |

---

## Architecture

```
AkoufréOrder/
├── app/                  # React Native Expo
│   ├── screens/          # 5 écrans
│   ├── components/       # 10 composants réutilisables
│   ├── services/         # API, algorithme, notifications
│   ├── data/             # Catalogue 26 produits
│   └── types/            # Types TypeScript partagés
├── backend/              # Node.js + Express + Prisma
│   └── src/
│       ├── routes/       # stock, commande, stats
│       ├── services/     # logique métier
│       └── prisma/       # schema SQLite
└── playwright/           # Automatisation AkoufréNET
    └── auto_commande.py
```

---

## Variables d'environnement

### backend/.env
```
DATABASE_URL="file:./akoufre.db"
PORT=3000
```

### playwright/.env
```
AKOUFRE_USERNAME=votre_identifiant
AKOUFRE_PASSWORD=votre_mot_de_passe
TEST_MODE=true
```

> **Important :** Ne jamais committer les fichiers `.env`.
