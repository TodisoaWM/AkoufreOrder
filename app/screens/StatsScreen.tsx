import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import ProgressBar from '../components/ProgressBar';
import { getVentes, getRotation } from '../services/api';
import { StatVente, RotationProduit, JourFerie } from '../types';

const MOCK_VENTES: StatVente[] = Array.from({ length: 7 }, (_, i) => ({
  date: new Date(Date.now() - (6 - i) * 86400000).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: '2-digit',
  }),
  totalUnites: Math.round(Math.random() * 200 + 100),
}));

const MOCK_ROTATION: RotationProduit[] = [
  { code: 'PLEC0104', article: 'POULET ENTIER AKOUFRE', categorie: 'POULET ENTIER', tauxRotation: 96 },
  { code: 'SSPC0402A', article: 'PATTES FRAIS', categorie: 'TETE & PATTES CHAIR', tauxRotation: 88 },
  { code: 'PEVC0702', article: 'BOULETTE FRAICHE', categorie: 'BOULETTE', tauxRotation: 72 },
  { code: 'PEVC0801', article: 'BURGER', categorie: 'BURGER', tauxRotation: 54 },
  { code: 'PEVC0403', article: 'MORTADELLE - Tranché', categorie: 'MORTADELLE', tauxRotation: 38 },
  { code: 'PEVC0305', article: 'SAUCISSE AUX FINES HERBES', categorie: 'SAUCISSE', tauxRotation: 65 },
];

const MOCK_FERIES: JourFerie[] = [
  { id: 1, date: '2025-08-15', description: 'Assomption', coefficient: 2.0 },
  { id: 2, date: '2025-11-01', description: 'Toussaint', coefficient: 2.0 },
  { id: 3, date: '2025-12-25', description: 'Noël', coefficient: 2.0 },
];

export default function StatsScreen() {
  const [ventes, setVentes] = useState<StatVente[]>([]);
  const [rotation, setRotation] = useState<RotationProduit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [ventesData, rotationData] = await Promise.all([getVentes(), getRotation()]);
      setVentes(ventesData.length > 0 ? ventesData : MOCK_VENTES);
      setRotation(rotationData.length > 0 ? rotationData : MOCK_ROTATION);
    } catch {
      setVentes(MOCK_VENTES);
      setRotation(MOCK_ROTATION);
    } finally {
      setLoading(false);
    }
  };

  const maxVentes = Math.max(...ventes.map((v) => v.totalUnites), 1);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F6FC" />

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#7F77DD" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header scrollable */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Statistiques</Text>
            <Text style={styles.headerSub}>7 derniers jours</Text>
          </View>

          {/* Bar chart */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Volume de ventes (7 jours)</Text>
            <View style={styles.chartCard}>
              <View style={styles.chartBars}>
                {ventes.map((v, i) => {
                  const valeur = Number.isFinite(v.totalUnites) ? v.totalUnites : 0;
                  const heightPct = Math.max(0, Math.min(100, (valeur / maxVentes) * 100));
                  const isMax = valeur === maxVentes;
                  return (
                    <View key={i} style={styles.barWrapper}>
                      <Text style={styles.barValue}>{valeur}</Text>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.bar,
                            {
                              height: `${heightPct}%` as any,
                              backgroundColor: isMax ? '#1a0533' : '#7F77DD',
                              opacity: isMax ? 1 : Math.max(0.4, Math.min(1, 0.4 + heightPct / 200)),
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.barLabel}>{v.date}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Rotation */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rotation des produits</Text>
            <View style={styles.card}>
              {rotation.map((r) => (
                <ProgressBar
                  key={r.code}
                  label={r.article}
                  value={r.tauxRotation}
                  sublabel={r.categorie}
                />
              ))}
            </View>
          </View>

          {/* Jours fériés */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Prochains jours fériés</Text>
            <View style={styles.card}>
              {MOCK_FERIES.map((f) => {
                const d = new Date(f.date);
                const label = d.toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                });
                return (
                  <View key={f.id} style={styles.ferieRow}>
                    <View>
                      <Text style={styles.ferieDesc}>{f.description}</Text>
                      <Text style={styles.ferieDate}>{label}</Text>
                    </View>
                    <View style={styles.coeffBadge}>
                      <Text style={styles.coeffText}>×{f.coefficient}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F6FC',
  },
  header: {
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EEF8',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1a2e',
  },
  headerSub: {
    fontSize: 12,
    color: '#9A97B0',
    marginTop: 2,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 10,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 140,
    gap: 6,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barValue: {
    fontSize: 9,
    color: '#9A97B0',
    marginBottom: 2,
  },
  barTrack: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 9,
    color: '#9A97B0',
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  ferieRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EEF8',
  },
  ferieDesc: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  ferieDate: {
    fontSize: 12,
    color: '#9A97B0',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  coeffBadge: {
    backgroundColor: '#CECBF6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  coeffText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#7F77DD',
  },
});
