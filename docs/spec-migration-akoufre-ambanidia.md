# AkoufréOrder — Spécification complète pour migration/intégration

> Ce document décrit intégralement une application existante (« AkoufréOrder », prototype React Native Expo + Node/Express/Prisma/SQLite) afin de la réimplémenter/intégrer dans un nouveau projet avec la stack suivante :
> - **Backend** : NestJS + TypeScript + Prisma + PostgreSQL
> - **Frontend** : Expo (React Native Web) + TypeScript + Expo Router
>
> **Le module Playwright (automatisation du site AkoufréNET) est explicitement HORS PÉRIMÈTRE** de cette migration. Ne pas le réimplémenter.

---

## 1. Contexte métier

L'application sert à une échoppe (franchise **Akoufré Ambanidia**, vente de produits de volaille/charcuterie) à :
1. Saisir chaque soir le **stock restant** par produit (unité : **kilogrammes, avec décimales**).
2. Calculer automatiquement une **suggestion de commande** fournisseur, produit par produit, selon un algorithme métier précis (détaillé section 4).
3. Permettre l'ajustement manuel puis la validation de cette commande.
4. Conserver un **historique** des stocks et des commandes.
5. Afficher des **statistiques** (rotation produits, volumes, jours fériés).

Le fournisseur est **Eclosia Madagascar**, dont la plateforme de commande s'appelle **AkoufréNET**. Dans le prototype d'origine, un script Playwright devait automatiser la saisie sur ce site — **cette partie est explicitement exclue de la migration**. Le nouveau projet doit simplement produire une commande validée et stockée en base ; comment elle est ensuite transmise au fournisseur est hors sujet ici.

---

## 2. Catalogue produits (référentiel figé)

26 produits, répartis en 11 catégories. **Ce référentiel doit être seedé tel quel** (codes, articles, catégories) :

| Code | Article | Catégorie |
|---|---|---|
| PLEC0104 | POULET ENTIER AKOUFRE | POULET ENTIER |
| SSPC0402A | PATTES FRAIS | TETE & PATTES CHAIR |
| SSPC0402 | TETE | TETE & PATTES CHAIR |
| SSPC0202A | FOIE | FOIE & COEUR CHAIR |
| SSPC0202 | COEUR FRAIS | FOIE & COEUR CHAIR |
| PEVC0702 | BOULETTE FRAICHE | BOULETTE |
| PEVC0706 | BOULETTE PANEE PRECUITE | BOULETTE |
| PEVC0705 | BOULETTE FRAICHE AUX HERBES | BOULETTE |
| PEVC0801 | BURGER | BURGER |
| PEVC0403 | MORTADELLE - Tranché | MORTADELLE |
| PEVC0402 | MORTADELLE - NVP (Kely) | MORTADELLE |
| PEVC0401 | MORTADELLE - Bloc 1Kg | MORTADELLE |
| PEVC1301 | KITOZA POULET | MORTADELLE |
| PVEC1004 | VIANDE HACHEE EPICEE | MORTADELLE |
| PEVC0502 | CERVELAS - NVP (Kely) | CERVELAS |
| PEVC0501 | CERVELAS - Bloc 1Kg | CERVELAS |
| PEVC0503 | CERVELAS - Tranché | CERVELAS |
| SSPC0102 | CARCASSE DE POULET DE CHAIR FRAIS | CARCASSE CHAIR |
| SSPC0302 | GESIER FRAIS | ABAT |
| PEVC0601 | TERRINE BARQUETTE DE FOIE DE VOLAILLE | ABAT |
| PEVC0601A | TERRINE BLOC EN KG | ABAT |
| PEVC0305 | SAUCISSE AUX FINES HERBES | SAUCISSE |
| PEVC0307 | SAUCISSE AUX HERBES FUMEE | SAUCISSE |
| PEVC0304 | SAUCISSE FRANKFORT | SAUCISSE |
| PEVC0306 | SAUCISSE AU MIEL | SAUCISSE |
| PLEC0102A | POULET DECOUPES | POULET DECOUPES |

Chaque produit possède aussi, en base :
- `moyenneJour` (Float) — **référence manuelle de vente moyenne quotidienne en kg**, éditable, sert de base stable à l'algorithme hybride (voir section 4.3).
- `stockSecurite` (Float) — valeur de référence, mais **en pratique recalculée dynamiquement** en proportion de la moyenne effective (voir 4.4). Le champ statique n'est qu'un point de départ au seed.

Couleurs de catégorie (pour cohérence visuelle si le nouveau projet reprend un design similaire — optionnel) :
```
POULET ENTIER: #F0997B · TETE & PATTES CHAIR: #5DCAA5 · FOIE & COEUR CHAIR: #97C459
BOULETTE: #7F77DD · BURGER: #ED93B1 · MORTADELLE: #85B7EB · CERVELAS: #EF9F27
CARCASSE CHAIR: #B4B2A9 · ABAT: #D85A30 · SAUCISSE: #1D9E75 · POULET DECOUPES: #F0997B
```

---

## 3. Modèle de données (à porter en Prisma/PostgreSQL)

Schéma d'origine (SQLite) — à adapter en PostgreSQL (types `Float`→`Decimal` ou `Float` selon préférence, `DateTime` compatibles nativement) :

```prisma
model Produit {
  id             Int             @id @default(autoincrement())
  code           String          @unique
  article        String
  categorie      String
  moyenneJour    Float           @default(0)
  stockSecurite  Int             @default(0)   // valeur de référence initiale
  createdAt      DateTime        @default(now())
  stockEntrees   StockEntree[]
  lignesCommande LigneCommande[]
}

model StockEntree {
  id        Int      @id @default(autoincrement())
  produit   Produit  @relation(fields: [produitId], references: [id])
  produitId Int
  quantite  Float                 // en kg, décimales autorisées
  date      DateTime @default(now())   // date/heure de la pesée (modifiable par l'utilisateur, cf. 5.2)
}

model Commande {
  id            Int             @id @default(autoincrement())
  dateCommande  DateTime        @default(now())
  dateLivraison DateTime                          // date de livraison ciblée (Lun/Mer/Ven, cf. section 4)
  statut        String          @default("Soumis") // 'Soumis' | 'Modifiée' | 'Manqué'
  coefficient   Float           @default(1.0)
  totalUnites   Float           @default(0)        // en kg
  lignes        LigneCommande[]
}

model LigneCommande {
  id         Int      @id @default(autoincrement())
  commande   Commande @relation(fields: [commandeId], references: [id])
  commandeId Int
  produit    Produit  @relation(fields: [produitId], references: [id])
  produitId  Int
  quantite   Float                // kg commandés
  stock      Float    @default(0) // stock au moment de la commande (info)
}

model JourFerie {
  id          Int      @id @default(autoincrement())
  date        DateTime
  description String
  coefficient Float    @default(2.0)
}
```

**Points d'attention pour la migration PostgreSQL** :
- Toutes les quantités sont des **kg avec décimales** (2 décimales max en pratique) — ne pas utiliser `Int`.
- `StockEntree.date` : c'est la **date de la pesée**, potentiellement différente de la date de création de l'enregistrement (l'utilisateur peut saisir un stock « en retard », voir 5.2). Ne pas se fier à un `createdAt` implicite pour la logique métier — le champ `date` est la source de vérité.
- `Commande.dateLivraison` est distincte de `dateCommande` — c'est la date cible de livraison (Lundi/Mercredi/Vendredi), pas la date de saisie.

---

## 4. Algorithme de suggestion de commande (le cœur du système)

### 4.1. Cycle de livraison — fixe et non négociable

Le fournisseur ne livre **que les lundi, mercredi et vendredi**. La commande est passée le matin (avant 9h) pour une livraison **future** (jamais le jour même — la livraison arrive entre 9h et 12h) :

| Jour de commande (matin) | Jour de livraison ciblé | Période couverte | Jours à couvrir | Coefficient |
|---|---|---|---|---|
| Mardi | Mercredi | mer + jeu (jusqu'au ven matin) | 2 | ×1.0 |
| Jeudi | Vendredi | ven + sam + dim (jusqu'au lun matin) | 3 | ×1.5 (week-end) |
| Vendredi | Lundi | lun + mar (jusqu'au mer matin) | 2 | ×1.0 |

Règle de calcul générique (pas seulement ces 3 cas, pour supporter un sélecteur de date arbitraire — cf. 5.3) :
- La **cible** est le **prochain jour de livraison (Lun/Mer/Ven) strictement après la date de commande** (jamais le jour même).
- Le nombre de **jours à couvrir** = écart en jours calendaires entre la livraison ciblée et la **prochaine livraison régulière après celle-ci**.
- Le **coefficient passe à ×1.5** si la période couverte inclut un samedi ou un dimanche (« semaine week-end »).
- **Veille de fête** (un `JourFerie` tombe dans la période couverte) : coefficient forcé à celui du jour férié (au moins ×2.0), qui prévaut sur le calcul standard.

Pseudo-code de référence (TypeScript, à adapter côté NestJS) :

```ts
const JOURS_LIVRAISON = [1, 3, 5]; // 1=lundi, 3=mercredi, 5=vendredi (Date.getDay())

function prochaineLivraison(date: Date): Date {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + 1); // strictement après la date donnée
  while (!JOURS_LIVRAISON.includes(d.getDay())) d.setDate(d.getDate() + 1);
  return d;
}

function livraisonSuivante(livraison: Date): Date {
  const d = new Date(livraison);
  d.setDate(d.getDate() + 1);
  while (!JOURS_LIVRAISON.includes(d.getDay())) d.setDate(d.getDate() + 1);
  return d;
}

// À partir d'une date de LIVRAISON choisie (permet un appro exceptionnel hors cycle standard) :
function getInfoFromLivraison(livraison: Date) {
  const liv = new Date(livraison); liv.setHours(12, 0, 0, 0);
  const suivante = livraisonSuivante(liv);
  const joursACouvrir = Math.max(1, Math.round((suivante.getTime() - liv.getTime()) / 86400000));

  let couvreWeekend = false;
  const cur = new Date(liv);
  for (let i = 0; i < joursACouvrir; i++) {
    const dow = cur.getDay();
    if (dow === 0 || dow === 6) { couvreWeekend = true; break; }
    cur.setDate(cur.getDate() + 1);
  }
  return {
    coefficient: couvreWeekend ? 1.5 : 1.0,
    joursACouvrir,
    label: couvreWeekend ? 'Week-end ×1.5' : 'Standard ×1.0',
    dateLivraison: liv,
  };
}
```

### 4.2. Formule de quantité

```
quantité = (moyenneJourEffective × joursACouvrir × coefficient) − stockActuel + stockSécuritéCalculé
quantité = max(0, arrondi(quantité, 2 décimales))
```
- `stockActuel` = dernier stock pesé connu pour ce produit.
- Puis les **règles métier par produit** (section 4.5) s'appliquent en post-traitement.

### 4.3. Moyenne de vente « hybride »

Décision produit validée : la moyenne de vente utilisée dans la formule est un **mélange 50/50** entre :
1. **Référence manuelle stable** (`Produit.moyenneJour`, éditable, jamais écrasée automatiquement) ;
2. **Moyenne calculée depuis l'historique réel des pesées**, en tenant compte des livraisons intermédiaires — **piège important** : entre deux pesées de fin de journée, une livraison a pu ajouter du stock, donc :

```
ventes_entre_deux_pesées = stock_pesée_précédente + quantité_livrée_dans_l'intervalle − stock_pesée_suivante
```
Si `ventes < 0` sur un intervalle, l'écarter (donnée aberrante). La moyenne historique = `Σ ventes / Σ jours` sur les intervalles valides.

Le mélange hybride ne s'applique **que si au moins 2 intervalles fiables** existent dans l'historique ; sinon on garde uniquement la référence manuelle (évite de se baser sur une moyenne bruitée avec trop peu de données).

```ts
const moyenneEffective = intervallesFiables >= 2
  ? 0.5 * referenceManuelle + 0.5 * moyenneHistorique
  : referenceManuelle;
```

**Important** : ne jamais écraser automatiquement `Produit.moyenneJour` avec un calcul — ce champ doit rester une valeur de référence stable, éditée uniquement manuellement. Le calcul hybride se fait **à la volée** à chaque suggestion, jamais persisté sur le produit.

### 4.4. Stock de sécurité proportionnel

Le stock de sécurité n'est **pas une constante fixe par produit** — il est recalculé à chaque suggestion en proportion de la moyenne effective :

```
stockSécurité = max(0.5, arrondi(moyenneEffective × 0.25, 2))
```
(≈ un quart de journée de vente, minimum 0,5 kg).

### 4.5. Règles métier par produit (post-traitement, appliqué APRÈS le calcul)

Ces règles sont **spécifiques à cette échoppe** et doivent rester **configurables** (idéalement en base ou dans un module de config dédié, pas juste en dur, pour faciliter les futurs ajustements) :

**a) Produits jamais commandés** (suggestion forcée à 0, champ restant modifiable manuellement) :
```
PEVC0705 (BOULETTE FRAICHE AUX HERBES), PEVC0403 (MORTADELLE-Tranché),
PEVC0402 (MORTADELLE-NVP Kely), PEVC1301 (KITOZA POULET),
PVEC1004 (VIANDE HACHEE EPICEE), PEVC0502 (CERVELAS-NVP Kely),
PEVC0503 (CERVELAS-Tranché), PEVC0601 (TERRINE BARQUETTE),
PEVC0306 (SAUCISSE AU MIEL), PLEC0102A (POULET DECOUPES)
```

**b) Plafonds (quantité commandée ≤ valeur, en kg)** :
```
PEVC0706 (BOULETTE PANEE PRECUITE)   ≤ 3
PEVC0702 (BOULETTE FRAICHE)          ≤ 10
PEVC0801 (BURGER)                   ≤ 8
PEVC0401 (MORTADELLE - Bloc 1Kg)     ≤ 2
PEVC0501 (CERVELAS - Bloc 1Kg)       ≤ 2
SSPC0302 (GESIER FRAIS)              ≤ 8
PEVC0601A (TERRINE BLOC EN KG)       ≤ 1.5
PEVC0305 (SAUCISSE AUX FINES HERBES) ≤ 3   (+ règle spéciale ci-dessous)
PEVC0307 (SAUCISSE AUX HERBES FUMEE) ≤ 3
PEVC0304 (SAUCISSE FRANKFORT)        ≤ 3
SSPC0402A (PATTES FRAIS)             ≤ 20
SSPC0402 (TETE)                      ≤ 20
```

**c) Plancher (quantité commandée ≥ valeur)** :
```
SSPC0102 (CARCASSE DE POULET DE CHAIR FRAIS) ≥ 80  (toujours commander le maximum, jamais moins de 80 kg)
```

**d) Règle spéciale périssable** — SAUCISSE AUX FINES HERBES (`PEVC0305`) : produit périssable rapidement.
```
Si stockActuel < 1 kg → quantité forcée à 0 (ne pas commander malgré la demande)
Sinon → plafond normal de 3 kg s'applique
```
Cette règle est **prioritaire** sur le plafond.

**e) Règle relationnelle** — TÊTE = toujours la **moitié** de la quantité finale de PATTES (calculée après application des plafonds sur PATTES) :
```
quantité(TETE) = min( quantité(PATTES) / 2 , plafond(TETE)=20 )
```

**Ordre d'application recommandé** (reproduit fidèlement l'original) : pour chaque ligne — exclusion → règle périssable → plancher → plafond → arrondi 2 décimales et clamp ≥ 0 ; puis, une fois toutes les lignes traitées, appliquer la règle relationnelle TÊTE/PATTES en dernier (car elle dépend de la quantité finale, post-plafond, de PATTES).

### 4.6. Jours fériés

Table `JourFerie` (date, description, coefficient — par défaut ×2.0). Si une fête tombe dans la période couverte par la livraison ciblée, le coefficient effectif devient `max(coefficient_fête, coefficient_standard)`.

---

## 5. Modules et fonctionnalités attendues

### 5.1. Module Stock (saisie fin de journée)
- Formulaire de saisie de quantité **en kg avec décimales** (virgule ou point accepté, 2 décimales max) pour chaque produit, groupé par catégorie (accordéon).
- **Aucune valeur pré-remplie** dans les champs de saisie (exigence produit explicite : le champ de saisie doit toujours démarrer vide, même si un dernier stock est connu).
- **Affichage de référence** (à côté/sous chaque champ, sans le pré-remplir) : dernier stock connu pour ce produit + date de la dernière pesée, ou « Aucun stock précédent ».
- **Date de la pesée modifiable** : par défaut la date du jour, mais l'utilisateur peut reculer (pesée faite en retard, ex. le lendemain matin) — jamais dans le futur. Cette date est celle enregistrée sur `StockEntree.date`, pas forcément « maintenant ».
- Bouton explicite **« Enregistrer le stock du jour »** (pas d'action implicite cachée derrière un autre bouton) — retour visuel clair de succès/échec.
- **Historique des stocks** consultable : liste des jours passés, regroupés par date calendaire, dépliables, avec le détail par produit et le total du jour.
- Warnings et confirmations doivent être des **bannières inline dans l'UI**, jamais des popups natives bloquantes (important si le rendu web est supporté — les alertes système ne fonctionnent pas de façon fiable sur web).

### 5.2. Module Commande
- Calcul de la **suggestion automatique** (algorithme section 4) à partir du **dernier stock réel** connu par produit.
- Chaque ligne produit affiche : quantité suggérée (modifiable manuellement), une **formule explicative** (ex. `Moy/j 8 · ×1 · 2j · −5 stock`), et le **dernier stock de référence**.
- **Sélecteur de date de livraison** : par défaut la prochaine livraison régulière (Lun/Mer/Ven), mais modifiable pour un **approvisionnement exceptionnel** (hors cycle standard) — dans ce cas, avertissement visuel explicite (« livraison exceptionnelle »). Navigation uniquement entre jours de livraison valides (Lun/Mer/Ven), impossible de sélectionner une date dans le passé.
- Changer la date recalcule automatiquement la suggestion (nouveau coefficient/jours à couvrir).
- **Validation en deux temps** (anti-clic accidentel) : premier clic = état "à confirmer" (bouton change d'état/couleur + texte récapitulatif du total), second clic = envoi réel. Un lien "annuler" doit permettre de revenir en arrière avant confirmation.
- À la validation : créer la `Commande` + ses `LigneCommande` (uniquement les lignes à quantité > 0), avec statut initial `Soumis`.
- Après succès, redirection vers l'historique des commandes.

### 5.3. Module Historique
- Liste des commandes passées (les plus récentes en premier), avec date de commande, date de livraison, statut, coefficient, total en kg.
- Détail d'une commande : toutes ses lignes (produit, quantité).
- Statut modifiable a posteriori : `Soumis` | `Modifiée` | `Manqué` (ex. si la livraison n'a finalement pas eu lieu comme prévu).
- État vide honnête si aucune commande n'existe encore (pas de fausses données de démonstration affichées comme si elles étaient réelles).

### 5.4. Module Statistiques / Dashboard
- **Dashboard résumé** (pour un écran d'accueil) : nombre d'articles en stock / total catalogue, taux de rotation moyen, date + total de la dernière commande, nombre de produits en stock critique (stock ≤ stock de sécurité).
- **Volume commandé sur les 7 derniers jours** (agrégation par jour calendaire des `totalUnites` des commandes).
- **Taux de rotation par produit** : évolution du stock sur les dernières pesées connues (ex. sur les 7 dernières entrées) — `tauxRotation = (stock_le_plus_ancien − stock_le_plus_récent) / stock_le_plus_ancien × 100`, clampé entre 0 et 100.
- **Jours fériés à venir** (liste des `JourFerie` futurs).
- Tous ces écrans doivent afficher un état vide clair (« pas encore assez de données ») plutôt que des données fictives, dès lors que de vraies données sont attendues en production.

### 5.5. Notifications (optionnel, à réévaluer selon la stack Expo Router)
Le prototype d'origine incluait des rappels programmés (`expo-notifications`) :
- Rappel quotidien à heure fixe (par défaut 16h) pour inciter à saisir le stock du jour.
- Notification de confirmation immédiate après envoi d'une commande.
Cette fonctionnalité est **secondaire** — à ré-implémenter seulement si le nouveau projet en a besoin ; ce n'est pas structurant pour l'algorithme ou les données.

---

## 6. API attendue (à adapter en contrôleurs NestJS)

Endpoints du prototype d'origine (Express), à reproduire fonctionnellement :

### Stock
- `GET /stock/dernier` → pour chaque produit : `{ id, code, article, categorie, moyenneJour, stockSecurite, dernierStock, dateDernierStock }` (dernier `StockEntree` connu, ou `null`).
- `GET /stock/historique` → liste groupée par jour calendaire : `{ date, total, lignes: [{ code, article, categorie, quantite, heure }] }`.
- `POST /stock` → body `{ entrees: [{ produitCode, quantite, date? }] }`. Résout `produitCode` → `produitId` côté serveur (ne jamais faire confiance à un id envoyé par le client). `date` optionnelle (défaut = maintenant).
- `GET /stock/critique` → produits dont le dernier stock ≤ `stockSecurite`.

### Commande
- `POST /commande/calculer` → body `{ dateLivraison? }` (ISO string ; si absent, calcule la prochaine livraison régulière). Retourne la suggestion complète : `{ lignes: [{ produitId, code, article, categorie, quantite, stockActuel, moyenneJour, stockSecurite, coefficient }], totalUnites, coefficient, joursACouvrir, label, dateLivraison }`. Applique l'algorithme complet (hybride + règles métier, section 4).
- `POST /commande` → body `{ dateLivraison, coefficient, lignes: [{ produitCode, quantite, stock }] }`. Résout les codes produit côté serveur. Crée la commande + ses lignes.
- `GET /commande` → historique (liste, plus récent en premier).
- `GET /commande/:id` → détail d'une commande avec ses lignes.
- `PATCH /commande/:id/statut` → body `{ statut }`, valeurs valides : `Soumis | Modifiée | Manqué`.

### Stats
- `GET /stats/dashboard` → résumé pour l'écran d'accueil (section 5.4).
- `GET /stats/ventes` → volumes commandés des 7 derniers jours (par jour calendaire, y compris les jours à 0).
- `GET /stats/rotation` → taux de rotation par produit.
- `GET /stats/fetes` → jours fériés à venir (`gte: aujourd'hui`, triés, limités).
- `POST /stats/fetes` → création d'un jour férié `{ date, description, coefficient? }`.

**Principe de résolution des codes produits** : le frontend ne doit jamais envoyer d'`id` numérique de produit — toujours le `code` métier (ex. `PLEC0104`). C'est le backend qui résout `code → id` avant toute écriture en base. (Cela a été une source de bug critique dans le prototype d'origine : un payload envoyant un objet produit complet sans id cassait silencieusement l'insertion Prisma — bien valider ce point en NestJS avec des DTOs stricts.)

---

## 7. Points de vigilance issus de l'expérience du prototype (bugs déjà rencontrés, à éviter d'emblée)

1. **Unités en kg avec décimales partout** — ne jamais utiliser de type entier pour les quantités (stock, commande, moyenne). Utiliser `Float`/`Decimal` en base et valider proprement les entrées décimales côté formulaire (accepter virgule ET point comme séparateur, 2 décimales max).
2. **Ne jamais écraser `moyenneJour`** automatiquement à partir de l'historique — c'est une référence manuelle stable, le calcul hybride se fait à la volée.
3. **Confusion stock/livraison** : entre deux pesées, une livraison peut avoir eu lieu — toujours corriger le calcul de ventes réelles en soustrayant les quantités livrées dans l'intervalle (section 4.3), sinon les ventes calculées sont fausses (souvent négatives ou aberrantes).
4. **Résolution par code produit, jamais par id envoyé par le client** (section 6, dernier paragraphe) — source de bug critique dans le prototype (commandes non enregistrées silencieusement).
5. **Ne pas pré-remplir le champ de saisie du stock** avec le dernier stock connu — exigence produit explicite, seulement l'afficher en référence à côté.
6. **États vides honnêtes** : ne jamais afficher de données de démonstration comme si elles étaient réelles dans l'Historique ou les Stats une fois l'app en usage réel ; un repli "mode démo" ne doit être visible que si le backend est explicitement injoignable, et clairement signalé comme tel à l'utilisateur.
7. **Popups/Alertes** : si le rendu web (React Native Web) est utilisé, les `Alert.alert` de React Native ne s'affichent pas sur web — utiliser des bannières inline pour tout retour utilisateur (succès, erreur, confirmation).
8. **Champ de saisie numérique sur web** : un champ flex-row avec un texte d'unité à côté (ex. "kg") peut déborder de son cadre sur React Native Web si `minWidth: 0` n'est pas explicitement fixé sur l'input — penser à contraindre la largeur (`overflow: hidden`, `minWidth: 0`, `flexShrink: 1`).
9. **Jours de livraison** : bien respecter la règle "jamais le jour même, toujours strictement après" (section 4.1) — une erreur fréquente est d'inclure le jour courant comme cible de livraison possible, ce qui décale tout le cycle.
10. **Le calcul de commande doit être piloté par la date de LIVRAISON choisie**, pas seulement par "aujourd'hui" — nécessaire pour supporter le sélecteur d'approvisionnement exceptionnel (section 5.2) sans dupliquer la logique.

---

## 8. Hors périmètre (explicitement exclu de cette migration)

- **Script Playwright d'automatisation du site AkoufréNET** (`auto_commande.py` dans le prototype d'origine) — ne pas réimplémenter. La commande validée reste une donnée interne à l'application ; sa transmission au fournisseur est un sujet séparé, traité ultérieurement si besoin, indépendamment de cette migration.
- Authentification / gestion multi-utilisateurs — le prototype d'origine est mono-utilisateur ; à concevoir séparément si le nouveau projet en a besoin (non spécifié ici).

---

## 9. Ce qu'on attend de vous (instructions pour la session cible)

En reprenant ce document :
1. Concevoir le schéma Prisma/PostgreSQL équivalent (section 3), avec migrations propres.
2. Réimplémenter l'algorithme de suggestion de commande (section 4) fidèlement, idéalement dans un module/service NestJS dédié et testable unitairement (la logique de dates et de règles métier s'y prête bien).
3. Exposer les endpoints (section 6) via des contrôleurs NestJS avec DTOs validés (class-validator), en respectant le principe de résolution par code produit (jamais d'id venant du client).
4. Réimplémenter les écrans/fonctionnalités (section 5) côté Expo Router, en conservant les comportements UX explicitement décrits (validation en 2 temps, champ de saisie jamais pré-rempli, bannières inline plutôt que popups, sélecteur de date de livraison, etc.).
5. Tenir compte des points de vigilance (section 7) dès la conception pour éviter de reproduire les bugs déjà rencontrés et corrigés dans le prototype d'origine.
