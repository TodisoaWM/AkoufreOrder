import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface HeroCardProps {
  totalUnites: number;
  labelPeriode: string;
  dateLivraison: string;
  coefficient: number;
}

export default function HeroCard({ totalUnites, labelPeriode, dateLivraison, coefficient }: HeroCardProps) {
  const isWeekend = coefficient >= 1.5;
  const isFete = coefficient >= 2.0;

  return (
    <View style={styles.card}>
      <Text style={styles.nextLabel}>Prochaine commande</Text>
      <Text style={styles.units}>{totalUnites} unités suggérées</Text>
      <View style={styles.pills}>
        <View style={[styles.pill, styles.pillOrange]}>
          <Text style={styles.pillTextOrange}>
            {isFete ? 'Veille fête ×2.0' : isWeekend ? 'Week-end ×1.5' : 'Standard ×1.0'}
          </Text>
        </View>
        <View style={[styles.pill, styles.pillTeal]}>
          <Text style={styles.pillTextTeal}>Livraison {dateLivraison}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
  },
  nextLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginBottom: 4,
  },
  units: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 10,
  },
  pills: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  pillOrange: {
    backgroundColor: '#EF9F27',
  },
  pillTeal: {
    backgroundColor: '#5DCAA5',
  },
  pillTextOrange: {
    color: '#1a0533',
    fontSize: 11,
    fontWeight: '700',
  },
  pillTextTeal: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
