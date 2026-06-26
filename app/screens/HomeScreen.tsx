import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  RefreshControl,
} from 'react-native';
import HeroCard from '../components/HeroCard';
import StatTile from '../components/StatTile';
import AlertBanner from '../components/AlertBanner';
import { TabName } from '../types';
import { getPeriodeInfo, formatDate } from '../services/algorithm';

interface HomeScreenProps {
  onNavigate: (tab: TabName) => void;
}

export default function HomeScreen({ onNavigate }: HomeScreenProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [periodeInfo, setPeriodeInfo] = useState(getPeriodeInfo(new Date()));

  useEffect(() => {
    setPeriodeInfo(getPeriodeInfo(new Date()));
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const isWeekend = periodeInfo.coefficient >= 1.5;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#1a0533" />

      {/* Content zone */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7F77DD" />}
      >
        {/* Hero zone — scrolls with content */}
        <View style={styles.hero}>
          <Text style={styles.greeting}>Bonjour,</Text>
          <Text style={styles.shopName}>Akoufré Ambanidia — Echoppe</Text>
          <HeroCard
            totalUnites={302}
            labelPeriode={periodeInfo.label}
            dateLivraison={formatDate(periodeInfo.dateLivraison)}
            coefficient={periodeInfo.coefficient}
          />
        </View>

        {isWeekend && (
          <AlertBanner
            message="Commande week-end — quantités augmentées."
            variant="warning"
            icon="📅"
          />
        )}

        <Text style={styles.sectionTitle}>Tableau de bord</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatTile
              label="Articles en stock"
              value="18/25"
              icon="📦"
              accentColor="#7F77DD"
            />
            <StatTile
              label="Rotation moy."
              value="94%"
              icon="🔄"
              accentColor="#5DCAA5"
            />
          </View>
          <View style={styles.statsRow}>
            <StatTile
              label="Dernière commande"
              value="Jeu 19/06"
              icon="📋"
              accentColor="#EF9F27"
            />
            <StatTile
              label="Stock critique"
              value="2 produits"
              icon="⚠️"
              accentColor="#E24B4A"
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Actions rapides</Text>
        <View style={styles.shortcuts}>
          <TouchableOpacity
            style={[styles.shortcutBtn, styles.shortcutTeal]}
            onPress={() => onNavigate('Stock')}
            activeOpacity={0.85}
          >
            <Text style={styles.shortcutIcon}>📦</Text>
            <Text style={styles.shortcutText}>Saisir stock</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.shortcutBtn, styles.shortcutViolet]}
            onPress={() => onNavigate('Historique')}
            activeOpacity={0.85}
          >
            <Text style={styles.shortcutIcon}>📋</Text>
            <Text style={styles.shortcutText}>Historique</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F6FC',
  },
  hero: {
    backgroundColor: '#1a0533',
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  greeting: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    marginBottom: 2,
  },
  shopName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  content: {
    flex: 1,
  },
  contentInner: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 10,
    marginTop: 4,
  },
  statsGrid: {
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  shortcuts: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  shortcutBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  shortcutTeal: {
    backgroundColor: '#5DCAA5',
  },
  shortcutViolet: {
    backgroundColor: '#CECBF6',
  },
  shortcutIcon: {
    fontSize: 18,
  },
  shortcutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a0533',
  },
});
