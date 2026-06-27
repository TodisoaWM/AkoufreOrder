import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import CategoryAccordion from '../components/CategoryAccordion';
import SummaryCard from '../components/SummaryCard';
import AlertBanner from '../components/AlertBanner';
import { getCategories, getProduitsByCategorie, PRODUITS } from '../data/produits';
import {
  calculerQuantite,
  getPeriodeInfo,
  getPeriodeInfoLivraison,
  livraisonPrecedente,
  livraisonSuivanteReguliere,
  formatDate,
  formatDateLong,
} from '../services/algorithm';
import { saveCommande, calculerSuggestion } from '../services/api';
import { TabName } from '../types';
import { formatKg } from '../services/format';

interface CommandeScreenProps {
  onNavigate: (tab: TabName) => void;
}

interface BaseProduit {
  moyenneJournaliere: number;
  stockActuel: number;
  stockSecurite: number;
}

export default function CommandeScreen({ onNavigate }: CommandeScreenProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [formulaHints, setFormulaHints] = useState<Record<string, string>>({});
  const [bases, setBases] = useState<Record<string, BaseProduit>>({});
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [feedback, setFeedback] = useState<{ variant: 'success' | 'error' | 'warning'; message: string } | null>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(true);
  // true = basé sur les vraies pesées (backend), false = repli démo local
  const [sourceReelle, setSourceReelle] = useState<boolean>(true);
  // Date de livraison ciblée — par défaut la prochaine livraison régulière
  const [dateLivraison, setDateLivraison] = useState<Date>(() => getPeriodeInfo(new Date()).dateLivraison);

  const periodeInfo = getPeriodeInfoLivraison(dateLivraison);
  const categories = getCategories();

  // Date plancher : on ne peut pas livrer aujourd'hui ou dans le passé (commande pour livraison future)
  const livraisonMin = getPeriodeInfo(new Date()).dateLivraison;
  const peutReculer = dateLivraison.getTime() > livraisonMin.getTime();

  // Génère une seule fois les données de base (mock tant que le stock réel n'est pas branché)
  useEffect(() => {
    const initial: Record<string, BaseProduit> = {};
    PRODUITS.forEach((p) => {
      // Données de DÉMONSTRATION réalistes (en attendant le branchement des vraies ventes) :
      // une échoppe vend de l'ordre de 2 à 12 kg/jour par produit.
      const moyenneJournaliere = Math.round((Math.random() * 10 + 2) * 10) / 10; // 2,0 – 12,0 kg/j
      // Stock restant : entre 0 et ~1 jour de vente
      const stockActuel = Math.round(Math.random() * moyenneJournaliere * 10) / 10;
      // Stock de sécurité proportionnel (≈ 1/4 de journée), au moins 0,5 kg
      const stockSecurite = Math.max(0.5, Math.round(moyenneJournaliere * 0.25 * 10) / 10);
      initial[p.code] = { moyenneJournaliere, stockActuel, stockSecurite };
    });
    setBases(initial);
  }, []);

  // Repli local (démo) quand le backend est injoignable
  const calculerLocal = () => {
    const qty: Record<string, number> = {};
    const hints: Record<string, string> = {};
    PRODUITS.forEach((p) => {
      const base = bases[p.code];
      if (!base) return;
      const result = calculerQuantite({
        moyenneJournaliere: base.moyenneJournaliere,
        stockActuel: base.stockActuel,
        stockSecurite: base.stockSecurite,
        coefficient: periodeInfo.coefficient,
        joursACouvrir: periodeInfo.joursACouvrir,
      });
      qty[p.code] = result.quantite;
      hints[p.code] = result.formulaHint;
    });
    setQuantities(qty);
    setFormulaHints(hints);
  };

  // Charge la suggestion RÉELLE depuis le backend (vraies pesées + moyenne hybride)
  // à chaque changement de date de livraison ; repli sur le calcul local en cas d'échec.
  useEffect(() => {
    let annule = false;
    const charger = async () => {
      setLoadingSuggestion(true);
      try {
        const sugg = await calculerSuggestion(dateLivraison.toISOString());
        if (annule) return;
        const qty: Record<string, number> = {};
        const hints: Record<string, string> = {};
        const fmt = (n: number) => formatKg(n);
        sugg.lignes.forEach((l) => {
          qty[l.code] = l.quantite;
          hints[l.code] =
            `Moy/j ${fmt(l.moyenneJour)} · ×${l.coefficient} · ${sugg.joursACouvrir}j · −${fmt(l.stockActuel)} stock`;
        });
        setQuantities(qty);
        setFormulaHints(hints);
        setSourceReelle(true);
      } catch {
        if (annule) return;
        // Backend injoignable → données de démonstration locales
        if (Object.keys(bases).length > 0) calculerLocal();
        setSourceReelle(false);
      } finally {
        if (!annule) setLoadingSuggestion(false);
      }
    };
    charger();
    return () => {
      annule = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateLivraison, bases]);

  const handleChangeValue = (code: string, value: number) => {
    setQuantities((prev) => ({ ...prev, [code]: value }));
    if (confirming) setConfirming(false);
    if (feedback) setFeedback(null);
  };

  const reculerLivraison = () => {
    if (peutReculer) setDateLivraison((prev) => livraisonPrecedente(prev));
    setConfirming(false);
    setFeedback(null);
  };
  const avancerLivraison = () => {
    setDateLivraison((prev) => livraisonSuivanteReguliere(prev));
    setConfirming(false);
    setFeedback(null);
  };
  const estLivraisonParDefaut = dateLivraison.getTime() === livraisonMin.getTime();

  const totalUnites = Object.values(quantities).reduce((s, v) => s + v, 0);

  // Confirmation en deux temps + retour visuel intégré (Alert ne marche pas sur le web)
  const handleValider = () => {
    if (totalUnites <= 0) {
      setFeedback({ variant: 'warning', message: 'Aucune quantité à envoyer.' });
      return;
    }
    if (!confirming) {
      setConfirming(true);
      return;
    }
    envoyerCommande();
  };

  const envoyerCommande = async () => {
    setConfirming(false);
    setLoading(true);
    setFeedback(null);
    try {
      const lignes = PRODUITS.map((p) => ({
        produit: p,
        quantite: quantities[p.code] || 0,
        stock: 0,
        moyenneJour: 0,
        formulaHint: formulaHints[p.code] || '',
      })).filter((l) => l.quantite > 0);

      await saveCommande({
        dateCommande: new Date().toISOString(),
        dateLivraison: periodeInfo.dateLivraison.toISOString(),
        statut: 'Soumis',
        coefficient: periodeInfo.coefficient,
        totalUnites,
        lignes,
      });

      setFeedback({ variant: 'success', message: 'Commande envoyée sur AkoufréNET ✅' });
      setTimeout(() => onNavigate('Historique'), 1200);
    } catch (err) {
      setFeedback({ variant: 'error', message: 'Impossible d\'envoyer la commande. Vérifiez la connexion.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F6FC" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header scrollable */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => onNavigate('Stock')}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Commande du jour</Text>
        </View>

        {/* Sélecteur de date de livraison (appro exceptionnel) */}
        <View style={styles.dateSelector}>
          <Text style={styles.dateSelectorLabel}>Date de livraison</Text>
          <View style={styles.dateSelectorControls}>
            <TouchableOpacity
              style={[styles.dateArrow, !peutReculer && styles.dateArrowDisabled]}
              onPress={reculerLivraison}
              activeOpacity={0.7}
              disabled={!peutReculer}
            >
              <Text style={[styles.dateArrowText, !peutReculer && styles.dateArrowTextDisabled]}>◀</Text>
            </TouchableOpacity>
            <Text style={styles.dateValue}>{formatDateLong(dateLivraison)}</Text>
            <TouchableOpacity style={styles.dateArrow} onPress={avancerLivraison} activeOpacity={0.7}>
              <Text style={styles.dateArrowText}>▶</Text>
            </TouchableOpacity>
          </View>
          {estLivraisonParDefaut ? (
            <Text style={styles.dateHint}>Prochaine livraison · {periodeInfo.joursACouvrir} j à couvrir</Text>
          ) : (
            <Text style={[styles.dateHint, styles.dateHintExceptionnel]}>
              ⚠️ Livraison exceptionnelle · {periodeInfo.joursACouvrir} j à couvrir
            </Text>
          )}
        </View>

        <SummaryCard
          totalUnites={totalUnites}
          dateLivraison={formatDate(periodeInfo.dateLivraison)}
          coefficient={periodeInfo.coefficient}
          labelPeriode={periodeInfo.label}
        />

        {feedback && <AlertBanner message={feedback.message} variant={feedback.variant} />}

        {loadingSuggestion ? (
          <AlertBanner message="Calcul de la suggestion en cours…" variant="info" icon="⏳" />
        ) : sourceReelle ? (
          <AlertBanner message="Suggestion basée sur vos vraies pesées (moyenne ajustée par l'historique)." variant="success" icon="📊" />
        ) : (
          <AlertBanner message="Serveur injoignable — suggestion de démonstration. Démarrez le backend pour le calcul réel." variant="warning" />
        )}

        {categories.map((cat, index) => (
          <CategoryAccordion
            key={cat}
            categorie={cat}
            produits={getProduitsByCategorie(cat)}
            values={quantities}
            onChangeValue={handleChangeValue}
            formulaHints={formulaHints}
            defaultOpen={index === 0}
          />
        ))}

        <View style={{ height: 16 }} />
      </ScrollView>

      {/* Bouton fixe en bas */}
      <View style={styles.bottomBar}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatKg(totalUnites)} kg</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.sendButton,
            confirming && styles.sendButtonConfirm,
            loading && styles.sendButtonDisabled,
          ]}
          onPress={handleValider}
          activeOpacity={0.85}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.sendButtonText}>
              {confirming
                ? `Confirmer l'envoi de ${formatKg(totalUnites)} kg`
                : 'Valider et envoyer sur AkoufréNET'}
            </Text>
          )}
        </TouchableOpacity>
        {confirming && !loading && (
          <TouchableOpacity onPress={() => setConfirming(false)} activeOpacity={0.7} style={styles.cancelBtn}>
            <Text style={styles.cancelBtnText}>Annuler</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F6FC',
  },
  dateSelector: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  dateSelectorLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9A97B0',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  dateSelectorControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateArrow: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F0EEF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateArrowDisabled: {
    backgroundColor: '#F7F6FC',
  },
  dateArrowText: {
    fontSize: 14,
    color: '#7F77DD',
    fontWeight: '700',
  },
  dateArrowTextDisabled: {
    color: '#D8D5E8',
  },
  dateValue: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '800',
    color: '#1a1a2e',
    textTransform: 'capitalize',
  },
  dateHint: {
    fontSize: 11,
    color: '#9A97B0',
    marginTop: 6,
    textAlign: 'center',
  },
  dateHintExceptionnel: {
    color: '#EF9F27',
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EEF8',
    marginBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F7F6FC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  backIcon: {
    fontSize: 18,
    color: '#1a1a2e',
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1a1a2e',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  bottomBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0EEF8',
    padding: 16,
    paddingBottom: 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  totalLabel: {
    fontSize: 14,
    color: '#9A97B0',
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1a2e',
  },
  sendButton: {
    backgroundColor: '#7F77DD',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#7F77DD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sendButtonConfirm: {
    backgroundColor: '#5DCAA5',
    shadowColor: '#5DCAA5',
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelBtn: {
    marginTop: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#9A97B0',
    fontSize: 13,
    fontWeight: '600',
  },
});
