"""
AkoufréOrder — Script d'automatisation Playwright
Automatise la saisie de commande sur AkoufréNET (Eclosia Madagascar)
"""

import json
import os
import sys
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv
from playwright.sync_api import sync_playwright

load_dotenv()

USERNAME = os.getenv("AKOUFRE_USERNAME", "")
PASSWORD = os.getenv("AKOUFRE_PASSWORD", "")
TEST_MODE = os.getenv("TEST_MODE", "true").lower() == "true"
URL_BASE = "https://akoufrenet.eclosia.mg"

COMMANDE_JSON = Path(__file__).parent.parent / "backend" / "commande.json"
CONFIRMATIONS_DIR = Path(__file__).parent / "confirmations"
CONFIRMATIONS_DIR.mkdir(exist_ok=True)


def charger_commande() -> dict:
    if not COMMANDE_JSON.exists():
        print(f"[ERREUR] Fichier commande.json introuvable : {COMMANDE_JSON}")
        sys.exit(1)
    with open(COMMANDE_JSON, "r", encoding="utf-8") as f:
        return json.load(f)


def sauvegarder_screenshot(page, suffixe: str = "") -> str:
    horodatage = datetime.now().strftime("%Y%m%d_%H%M%S")
    nom = f"confirmation_{horodatage}{suffixe}.png"
    chemin = CONFIRMATIONS_DIR / nom
    page.screenshot(path=str(chemin), full_page=True)
    print(f"[INFO] Capture d'écran sauvegardée : {chemin}")
    return str(chemin)


def executer_commande():
    commande = charger_commande()
    lignes_par_categorie: dict[str, list[dict]] = {}
    for ligne in commande.get("lignes", []):
        cat = ligne["categorie"]
        lignes_par_categorie.setdefault(cat, []).append(ligne)

    print(f"[INFO] Mode TEST : {TEST_MODE}")
    print(f"[INFO] Commande #{commande.get('id')} — {commande.get('totalUnites')} unités")

    with sync_playwright() as p:
        navigateur = p.chromium.launch(headless=not TEST_MODE)
        contexte = navigateur.new_context(locale="fr-FR")
        page = contexte.new_page()

        # 1. Connexion
        print("[INFO] Connexion à AkoufréNET...")
        page.goto(URL_BASE)
        page.wait_for_load_state("networkidle")

        page.fill('input[name="username"], input[placeholder*="utilisateur" i], input[type="text"]:first-of-type', USERNAME)
        page.fill('input[name="password"], input[type="password"]', PASSWORD)
        page.click('button[type="submit"], input[type="submit"], button:has-text("CONNEXION")')
        page.wait_for_load_state("networkidle")
        print("[INFO] Connexion réussie.")

        # 2. Module COMMANDE
        page.click('a:has-text("COMMANDE"), button:has-text("COMMANDE"), [href*="commande" i]')
        page.wait_for_load_state("networkidle")
        print("[INFO] Module COMMANDE ouvert.")

        # 3. Sélection date + SUIVANT
        date_livraison = commande.get("dateLivraison", "")[:10]
        try:
            page.click(f'[data-date="{date_livraison}"], td:has-text("{date_livraison}")')
        except Exception:
            page.click('table.calendrier td:not(.disabled):first-of-type')
        page.click('button:has-text("SUIVANT"), input[value="SUIVANT"]')
        page.wait_for_load_state("networkidle")
        print("[INFO] Date sélectionnée.")

        # 4. Saisie des quantités par catégorie
        for categorie, lignes in lignes_par_categorie.items():
            print(f"[INFO] Catégorie : {categorie}")
            try:
                page.click(f'[data-categorie*="{categorie}" i], h3:has-text("{categorie}"), .accordion-header:has-text("{categorie}")')
                page.wait_for_timeout(300)
            except Exception:
                pass

            for ligne in lignes:
                if ligne["quantite"] <= 0:
                    continue
                code = ligne["code"]
                quantite = ligne["quantite"]
                try:
                    champ = page.locator(
                        f'tr[data-code="{code}"] input, '
                        f'input[data-code="{code}"], '
                        f'input[name="{code}"], '
                        f'input[id*="{code}"]'
                    ).first
                    champ.fill(str(quantite))
                    print(f"  [OK] {ligne['article']} ({code}) → {quantite}")
                except Exception as e:
                    print(f"  [AVERTISSEMENT] Impossible de remplir {code} : {e}")

        sauvegarder_screenshot(page, "_avant_validation")

        if TEST_MODE:
            print("[MODE TEST] Arrêt avant le bouton COMMANDER — vérifiez la capture d'écran.")
            contexte.close()
            navigateur.close()
            return

        # 5. Validation finale
        page.click('button:has-text("COMMANDER"), input[value="COMMANDER"]')
        page.wait_for_load_state("networkidle")
        chemin = sauvegarder_screenshot(page, "_confirmation")
        print(f"[SUCCÈS] Commande envoyée ! Capture : {chemin}")

        contexte.close()
        navigateur.close()


if __name__ == "__main__":
    if not USERNAME or not PASSWORD:
        print("[ERREUR] AKOUFRE_USERNAME et AKOUFRE_PASSWORD doivent être définis dans .env")
        sys.exit(1)
    executer_commande()
