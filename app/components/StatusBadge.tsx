import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Statut = 'Soumis' | 'Modifiée' | 'Manqué';

interface StatusBadgeProps {
  statut: Statut;
}

const STATUT_STYLES: Record<Statut, { bg: string; text: string }> = {
  Soumis: { bg: '#E1F5EE', text: '#1D9E75' },
  Modifiée: { bg: '#FFF8EC', text: '#A05F00' },
  Manqué: { bg: '#FDEAEA', text: '#E24B4A' },
};

export default function StatusBadge({ statut }: StatusBadgeProps) {
  const style = STATUT_STYLES[statut] || STATUT_STYLES['Soumis'];

  return (
    <View style={[styles.badge, { backgroundColor: style.bg }]}>
      <Text style={[styles.text, { color: style.text }]}>{statut}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
  },
});
