# ✅ Checklist de test — AkoufréOrder

Suis les points dans l'ordre. Pour chaque ligne : **OK** si ça marche, sinon note ce qui cloche (écran, ce que tu as fait, ce qui s'est passé).

---

## 0. Prérequis (à faire une fois)

- [ ] `git pull` dans **`app`** et dans **`backend`**
- [ ] Backend : `npm run prisma:setup` (réinitialise les moyennes de référence)
- [ ] Démarrer le **backend** (port 3000) — vérifier le message « Serveur AkoufréOrder démarré sur le port 3000 »
- [ ] Démarrer l'**app** (Expo web) et l'ouvrir dans le navigateur
- [ ] Test rapide serveur : ouvrir `http://localhost:3000/api/sante` → doit afficher `{"statut":"ok",...}`

---

## 1. Écran Stock

- [ ] La **date du stock** s'affiche (aujourd'hui par défaut), modifiable avec ◀ ▶
- [ ] Impossible d'aller **après aujourd'hui** (flèche ▶ désactivée)
- [ ] Sous chaque produit : **« Dernier stock : X kg · date »** (ou « Aucun stock précédent »)
- [ ] Saisie en **kg avec décimales** : taper `0,5`, `1,25` → s'affiche correctement, champ bien dans le cadre
- [ ] Bouton **« 💾 Enregistrer le stock du jour »** → bannière verte de confirmation
- [ ] Après enregistrement : le **dernier stock** affiché se met à jour
- [ ] Enregistrer **sans rien saisir** → bannière d'avertissement (pas de plantage)
- [ ] **🕑 Historique** → modal avec les jours, dépliables, quantités par produit + totaux

## 2. Écran Commande

- [ ] Indicateur **📊 « basé sur vos vraies pesées »** (vert)
- [ ] **Date de livraison** = prochain Lun/Mer/Ven (sélecteur ◀ ▶)
- [ ] Changer la date → mention **« Livraison exceptionnelle »** + quantités recalculées
- [ ] Sous chaque article : **formule** (violet) + **dernier stock** (gris)
- [ ] Le **total** en bas est cohérent (pas de chiffre aberrant)
- [ ] Modifier une quantité à la main → le total se met à jour
- [ ] **Valider** : 1er clic = bouton vert « Confirmer l'envoi de X kg » ; 2e clic = envoi
- [ ] Après envoi → bannière verte puis bascule sur **Historique**

## 3. Règles métier (à vérifier dans Commande)

- [ ] **Jamais commandés (= 0)** : MORTADELLE-Tranché, MORTADELLE-NVP, KITOZA, VIANDE HACHEE, CERVELAS-NVP, CERVELAS-Tranché, TERRINE BARQUETTE, SAUCISSE AU MIEL, POULET DECOUPES, BOULETTE FRAICHE AUX HERBES
- [ ] **CARCASSE DE POULET** : toujours **≥ 80 kg**
- [ ] **SAUCISSE AUX FINES HERBES** : ≤ 3 kg, et **0** si dernier stock < 1 kg
- [ ] **Plafonds** respectés : BOULETTE PANEE ≤ 3 · BOULETTE FRAICHE ≤ 10 · BURGER ≤ 8 · MORTADELLE Bloc ≤ 2 · CERVELAS Bloc ≤ 2 · GESIER ≤ 8 · TERRINE BLOC ≤ 1,5 · SAUCISSE FUMEE ≤ 3 · SAUCISSE FRANKFORT ≤ 3 · PATTES ≤ 20 · TÊTE ≤ 20
- [ ] **TÊTE = la moitié de PATTES**

## 4. Écran Historique

- [ ] La commande qu'on vient d'envoyer **apparaît en haut**
- [ ] Le compteur « N commande(s) » est correct
- [ ] Ouvrir une commande → **détail** : date, livraison, statut, total, **lignes par produit**
- [ ] Si aucune commande : message « Aucune commande enregistrée » (pas de fausses lignes)

## 5. Écran Accueil

- [ ] **Articles en stock** : X/26 (reflète les produits avec stock > 0)
- [ ] **Rotation moy.** : un %
- [ ] **Dernière commande** : la date de la commande envoyée
- [ ] **Stock critique** : nombre de produits ≤ stock de sécurité
- [ ] La **HeroCard** affiche un total de suggestion réaliste
- [ ] **Tirer pour rafraîchir** met à jour les chiffres

## 6. Écran Stats

- [ ] **Volume commandé (7 j)** : graphe avec les jours
- [ ] **Rotation des produits** : barres (ou message si pas assez de pesées)
- [ ] **Prochains jours fériés** (ou message si aucun)

## 7. Cas limites / robustesse

- [ ] **Arrêter le backend** puis ouvrir les écrans → bannières « serveur injoignable » partout (pas d'écran blanc / plantage)
- [ ] Redémarrer le backend → tout revient à la normale
- [ ] Changer d'onglet pendant une saisie non enregistrée → données perdues (normal), pas de crash
- [ ] Tester un **vendredi** (ou changer la date livraison sur un vendredi) → coefficient **×1.5**, 3 jours à couvrir

---

## 🐛 Bugs / remarques à remonter

| Écran | Ce que j'ai fait | Ce qui s'est passé | Attendu |
|---|---|---|---|
|   |   |   |   |
|   |   |   |   |
