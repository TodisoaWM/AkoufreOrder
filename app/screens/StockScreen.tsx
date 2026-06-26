import React, { useState } from 'react';
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
import AlertBanner from '../components/AlertBanner';
import { getCategories, getProduitsByCategorie } from '../data/produits';
import { saveStock } from '../services/api';
import { TabName } from '../types';

interface StockScreenProps {
  onNavigate: (tab: TabName) => void;
}

export default function StockScreen({ onNavigate }: StockScreenProps) {
  const [stockValues, setStockValues] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const categories = getCategories();

  const handleChangeValue = (code: string, value: number) => {
    setStockValues((prev) => ({ ...prev, [code]: value }));
  };

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handleCalculer = async () => {
    const entries = Object.entries(stockValues)
      .filter(([, q]) => q > 0)
      .map(([code, quantite]) => ({
        produitCode: code,
        quantite,
        date: new Date().toISOString(),
      }));

    if (entries.length === 0) {
      Alert.alert('Stock vide', 'Saisissez au moins une quantité en stock.');
      return;
    }

    setLoading(true);
    try {
      await saveStock(entries);
      onNavigate('Commande');
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de sauvegarder le stock. Vérifiez la connexion au serveur.');
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
            <Text style={styles.headerDate}>{today}</Text>
          </View>
        </View>

        <AlertBanner
          message="Saisissez les quantités restantes en stock."
          variant="info"
          icon="📝"
        />

        {categories.map((cat, index) => (
          <CategoryAccordion
            key={cat}
            categorie={cat}
            produits={getProduitsByCategorie(cat)}
            values={stockValues}
            onChangeValue={handleChangeValue}
            defaultOpen={index === 0}
          />
        ))}

        <View style={{ height: 16 }} />
      </ScrollView>

      {/* Bouton fixe en bas */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.calcButton, loading && styles.calcButtonDisabled]}
          onPress={handleCalculer}
          activeOpacity={0.85}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.calcButtonText}>Calculer la suggestion de commande</Text>
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
});
