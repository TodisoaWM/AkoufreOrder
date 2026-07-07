import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatKg } from '../services/format';

interface SummaryCardProps {
  totalUnites: number;
  dateLivraison: string;
  coefficient: number;
  labelPeriode: string;
}

export default function SummaryCard({
  totalUnites,
  dateLivraison,
  coefficient,
  labelPeriode,
}: SummaryCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View>
          <Text style={styles.units}>{formatKg(totalUnites)} kg</Text>
          <Text style={styles.livraison}>Livraison {dateLivraison}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>×{coefficient} {labelPeriode.split(' ')[0]}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a0533',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  units: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  livraison: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  badge: {
    backgroundColor: '#EF9F27',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    color: '#1a0533',
    fontSize: 13,
    fontWeight: '800',
  },
});
