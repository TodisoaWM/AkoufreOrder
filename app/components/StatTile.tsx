import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatTileProps {
  label: string;
  value: string;
  icon: string;
  accentColor?: string;
  bgColor?: string;
}

export default function StatTile({
  label,
  value,
  icon,
  accentColor = '#7F77DD',
  bgColor = '#FFFFFF',
}: StatTileProps) {
  return (
    <View style={[styles.tile, { backgroundColor: bgColor }]}>
      <View style={[styles.iconWrapper, { backgroundColor: accentColor + '20' }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={[styles.value, { color: accentColor }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    margin: 4,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 18,
  },
  value: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  label: {
    fontSize: 11,
    color: '#9A97B0',
    fontWeight: '500',
  },
});
