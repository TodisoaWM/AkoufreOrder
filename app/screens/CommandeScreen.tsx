import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import CategoryAccordion from '../components/CategoryAccordion';
import SummaryCard from '../components/SummaryCard';
import { getCategories, getProduitsByCategorie, PRODUITS } from '../data/produits';
import { calculerQuantite, getPeriodeInfo, formatDate } from '../services/algorithm';
import { saveCommande } from '../services/api';
import { TabName } from '../types';

interface CommandeScreenProps {
  onNavigate: (tab: TabName) => void;
}

export default function CommandeScreen({ onNavigate }: CommandeScreenProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [formulaHints, setFormulaHints] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const periodeInfo = getPeriodeInfo(new Date());
  const categories = getCategories();

  useEffect(() => {
    const initialQty: Record<string, number> = {};
    const hints: Record<string, string> = {};

    PRODUITS.forEach((p) => {
      const moyenneJournaliere = Math.round(Math.random() * 60 + 10);
      const stockActuel = Math.round(Math.random() * 20);
      const stockSecurite = 5;

      const result = calculerQuantite({
        moyenneJournaliere,
        stockActuel,
        stockSecurite,
        coefficient: periodeInfo.coefficient,
        joursACouvrir: periodeInfo.joursACouvrir,
      });

      initialQty[p.code] = result.quantite;
      hints[p.code] = result.formulaHint;
    });

    setQuantities(initialQty);
    setFormulaHints(hints);
  }, []);

  const handleChangeValue = (code: string, value: number) => {
    setQuantities((prev) => ({ ...prev, [code]: value }));
  };

  const totalUnites = Object.values(quantities).reduce((s, v) => s + v, 0);

  const handleValider = async () => {
    Alert.alert(
      'Confirmer la commande',
      `Envoyer ${totalUnites} unités sur AkoufréNET ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: 'default',
          onPress: async () => {
            setLoading(true);
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

              Alert.alert('Succès', 'Commande envoyée sur AkoufréNET.', [
                { text: 'OK', onPress: () => onNavigate('Historique') },
              ]);
            } catch (err) {
              Alert.alert('Erreur', 'Impossible d\'envoyer la commande. Vérifiez la connexion.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
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

        <SummaryCard
          totalUnites={totalUnites}
          dateLivraison={formatDate(periodeInfo.dateLivraison)}
          coefficient={periodeInfo.coefficient}
          labelPeriode={periodeInfo.label}
        />

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
          <Text style={styles.totalValue}>{totalUnites} unités</Text>
        </View>
        <TouchableOpacity
          style={[styles.sendButton, loading && styles.sendButtonDisabled]}
          onPress={handleValider}
          activeOpacity={0.85}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.sendButtonText}>Valider et envoyer sur AkoufréNET</Text>
          )}
        </TouchableOpacity>
      </View>
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
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
