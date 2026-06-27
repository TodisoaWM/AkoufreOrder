import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Modal,
} from 'react-native';
import CategoryAccordion from '../components/CategoryAccordion';
import AlertBanner from '../components/AlertBanner';
import { getCategories, getProduitsByCategorie } from '../data/produits';
import { saveStock, getHistoriqueStock, getDernierStock } from '../services/api';
import { TabName, StockHistoriqueJour } from '../types';
import { formatKg } from '../services/format';

interface StockScreenProps {
  onNavigate: (tab: TabName) => void;
}

export default function StockScreen({ onNavigate }: StockScreenProps) {
  const [stockValues, setStockValues] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [histoVisible, setHistoVisible] = useState(false);
  const [histoLoading, setHistoLoading] = useState(false);
  const [historique, setHistorique] = useState<StockHistoriqueJour[]>([]);
  const [jourOuvert, setJourOuvert] = useState<string | null>(null);
  // Retour visuel intégré (Alert ne fonctionne pas sur le web)
  const [feedback, setFeedback] = useState<{ variant: 'success' | 'error' | 'warning'; message: string } | null>(null);
  const [stockEnregistre, setStockEnregistre] = useState(false);
  // Dernier stock enregistré par produit (affiché en référence, sans pré-remplir le champ)
  const [dernierStock, setDernierStock] = useState<Record<string, { qte: number | null; date: string | null }>>({});
  // Date du stock — pré-remplie avec aujourd'hui, modifiable (ex : pesage fait le lendemain)
  const [stockDate, setStockDate] = useState(() => {
    const d = new Date();
    d.setHours(12, 0, 0, 0); // midi pour éviter les soucis de fuseau horaire
    return d;
  });

  const categories = getCategories();

  // Charge le dernier stock connu de chaque produit (référence)
  useEffect(() => {
    let annule = false;
    getDernierStock()
      .then((items) => {
        if (annule) return;
        const map: Record<string, { qte: number | null; date: string | null }> = {};
        items.forEach((it) => {
          map[it.code] = { qte: it.dernierStock, date: it.dateDernierStock };
        });
        setDernierStock(map);
      })
      .catch(() => {
        /* serveur injoignable — pas de référence affichée */
      });
    return () => {
      annule = true;
    };
  }, [stockEnregistre]);

  // Texte de référence affiché sous chaque produit
  const refHints: Record<string, string> = {};
  Object.entries(dernierStock).forEach(([code, info]) => {
    if (info.qte === null || info.qte === undefined) {
      refHints[code] = 'Aucun stock précédent';
    } else {
      const dateLabel = info.date
        ? new Date(info.date).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' })
        : '';
      refHints[code] = `Dernier stock : ${formatKg(info.qte)} kg${dateLabel ? ` · ${dateLabel}` : ''}`;
    }
  });

  const ouvrirHistorique = async () => {
    setHistoVisible(true);
    setHistoLoading(true);
    try {
      const data = await getHistoriqueStock();
      setHistorique(data);
      setJourOuvert(data.length > 0 ? data[0].date : null);
    } catch {
      setHistorique([]);
    } finally {
      setHistoLoading(false);
    }
  };

  const formatJour = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  const handleChangeValue = (code: string, value: number) => {
    setStockValues((prev) => ({ ...prev, [code]: value }));
    // Toute modification annule le message de confirmation précédent
    if (feedback || stockEnregistre) {
      setFeedback(null);
      setStockEnregistre(false);
    }
  };

  const stockDateLabel = stockDate.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Vrai si la date sélectionnée est aujourd'hui (empêche d'aller dans le futur)
  const estAujourdhui = (() => {
    const t = new Date();
    return (
      stockDate.getFullYear() === t.getFullYear() &&
      stockDate.getMonth() === t.getMonth() &&
      stockDate.getDate() === t.getDate()
    );
  })();

  const decalerDate = (jours: number) => {
    setStockDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + jours);
      d.setHours(12, 0, 0, 0);
      return d;
    });
  };

  const handleEnregistrer = async () => {
    const entries = Object.entries(stockValues)
      .filter(([, q]) => q > 0)
      .map(([code, quantite]) => ({
        produitCode: code,
        quantite,
        date: stockDate.toISOString(),
      }));

    if (entries.length === 0) {
      setStockEnregistre(false);
      setFeedback({ variant: 'warning', message: 'Saisissez au moins une quantité en stock avant d\'enregistrer.' });
      return;
    }

    setLoading(true);
    setFeedback(null);
    try {
      await saveStock(entries);
      const totalKg = entries.reduce((s, e) => s + e.quantite, 0);
      setStockEnregistre(true);
      setFeedback({
        variant: 'success',
        message: `Stock enregistré : ${entries.length} produit${entries.length > 1 ? 's' : ''} · ${formatKg(totalKg)} kg pour le ${stockDateLabel}.`,
      });
    } catch (err) {
      setStockEnregistre(false);
      setFeedback({
        variant: 'error',
        message: 'Impossible d\'enregistrer le stock. Vérifiez la connexion au serveur.',
      });
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
          <TouchableOpacity style={styles.backBtn} onPress={() => onNavigate('Accueil')}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Stock fin de journée</Text>
          </View>
          <TouchableOpacity style={styles.histoBtn} onPress={ouvrirHistorique} activeOpacity={0.8}>
            <Text style={styles.histoBtnIcon}>🕑</Text>
            <Text style={styles.histoBtnText}>Historique</Text>
          </TouchableOpacity>
        </View>

        {/* Sélecteur de date du stock */}
        <View style={styles.dateSelector}>
          <Text style={styles.dateSelectorLabel}>Date du stock</Text>
          <View style={styles.dateSelectorControls}>
            <TouchableOpacity
              style={styles.dateArrow}
              onPress={() => decalerDate(-1)}
              activeOpacity={0.7}
            >
              <Text style={styles.dateArrowText}>◀</Text>
            </TouchableOpacity>
            <Text style={styles.dateValue}>{stockDateLabel}</Text>
            <TouchableOpacity
              style={[styles.dateArrow, estAujourdhui && styles.dateArrowDisabled]}
              onPress={() => decalerDate(1)}
              activeOpacity={0.7}
              disabled={estAujourdhui}
            >
              <Text style={[styles.dateArrowText, estAujourdhui && styles.dateArrowTextDisabled]}>▶</Text>
            </TouchableOpacity>
          </View>
        </View>

        {feedback ? (
          <AlertBanner message={feedback.message} variant={feedback.variant} />
        ) : (
          <AlertBanner
            message="Saisissez les quantités restantes en stock."
            variant="info"
            icon="📝"
          />
        )}

        {categories.map((cat, index) => (
          <CategoryAccordion
            key={cat}
            categorie={cat}
            produits={getProduitsByCategorie(cat)}
            values={stockValues}
            onChangeValue={handleChangeValue}
            refHints={refHints}
            defaultOpen={index === 0}
          />
        ))}

        <View style={{ height: 16 }} />
      </ScrollView>

      {/* Boutons fixes en bas */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.calcButton, loading && styles.calcButtonDisabled]}
          onPress={handleEnregistrer}
          activeOpacity={0.85}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.calcButtonText}>
              {stockEnregistre ? '✅ Stock enregistré — réenregistrer' : '💾 Enregistrer le stock du jour'}
            </Text>
          )}
        </TouchableOpacity>

        {stockEnregistre && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => onNavigate('Commande')}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryButtonText}>Calculer la commande →</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Modal historique des stocks */}
      <Modal
        visible={histoVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setHistoVisible(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Historique des stocks</Text>
            <TouchableOpacity onPress={() => setHistoVisible(false)} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          {histoLoading ? (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color="#7F77DD" />
            </View>
          ) : historique.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyText}>Aucun stock enregistré pour le moment.</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
              {historique.map((jour) => {
                const ouvert = jourOuvert === jour.date;
                return (
                  <View key={jour.date} style={styles.jourCard}>
                    <TouchableOpacity
                      style={styles.jourHeader}
                      onPress={() => setJourOuvert(ouvert ? null : jour.date)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.jourInfo}>
                        <Text style={styles.jourDate}>{formatJour(jour.date)}</Text>
                        <Text style={styles.jourMeta}>
                          {jour.lignes.length} produit{jour.lignes.length > 1 ? 's' : ''} · {formatKg(jour.total)} kg
                        </Text>
                      </View>
                      <Text style={styles.jourChevron}>{ouvert ? '▲' : '▼'}</Text>
                    </TouchableOpacity>

                    {ouvert &&
                      jour.lignes.map((ligne, i) => (
                        <View key={`${ligne.code}-${i}`} style={styles.ligneRow}>
                          <View style={styles.ligneInfo}>
                            <Text style={styles.ligneArticle}>{ligne.article}</Text>
                            <Text style={styles.ligneCode}>{ligne.code}</Text>
                          </View>
                          <Text style={styles.ligneQty}>{formatKg(ligne.quantite)} kg</Text>
                        </View>
                      ))}
                  </View>
                );
              })}
              <View style={{ height: 24 }} />
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F6FC',
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
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1a1a2e',
  },
  headerDate: {
    fontSize: 12,
    color: '#9A97B0',
    marginTop: 1,
    textTransform: 'capitalize',
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
  calcButton: {
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
  calcButtonDisabled: {
    opacity: 0.6,
  },
  calcButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#7F77DD',
  },
  secondaryButtonText: {
    color: '#7F77DD',
    fontSize: 14,
    fontWeight: '700',
  },
  dateSelector: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
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
  histoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0EEF8',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
    marginLeft: 8,
  },
  histoBtnIcon: {
    fontSize: 13,
  },
  histoBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7F77DD',
  },
  modal: {
    flex: 1,
    backgroundColor: '#F7F6FC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EEF8',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1a2e',
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F7F6FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 14,
    color: '#9A97B0',
    fontWeight: '700',
  },
  modalContent: {
    padding: 16,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#9A97B0',
    textAlign: 'center',
  },
  jourCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
  },
  jourHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  jourInfo: {
    flex: 1,
    marginRight: 12,
  },
  jourDate: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1a1a2e',
    textTransform: 'capitalize',
  },
  jourMeta: {
    fontSize: 12,
    color: '#9A97B0',
    marginTop: 2,
  },
  jourChevron: {
    fontSize: 12,
    color: '#7F77DD',
  },
  ligneRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0EEF8',
  },
  ligneInfo: {
    flex: 1,
    marginRight: 12,
  },
  ligneArticle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  ligneCode: {
    fontSize: 11,
    color: '#9A97B0',
    marginTop: 1,
  },
  ligneQty: {
    fontSize: 16,
    fontWeight: '800',
    color: '#7F77DD',
  },
});
