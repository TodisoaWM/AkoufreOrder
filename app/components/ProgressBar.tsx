import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProgressBarProps {
  label: string;
  value: number; // 0-100
  sublabel?: string;
}

function getBarColor(value: number): string {
  if (value >= 70) return '#5DCAA5';
  if (value >= 40) return '#7F77DD';
  return '#EF9F27';
}

export default function ProgressBar({ label, value, sublabel }: ProgressBarProps) {
  const color = getBarColor(value);
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">
          {label}
        </Text>
        <Text style={[styles.percent, { color }]}>{Math.round(clamped)}%</Text>
      </View>
      {sublabel ? <Text style={styles.sublabel}>{sublabel}</Text> : null}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${clamped}%` as any, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  label: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a2e',
    marginRight: 8,
  },
  percent: {
    fontSize: 13,
    fontWeight: '700',
  },
  sublabel: {
    fontSize: 11,
    color: '#9A97B0',
    marginBottom: 4,
  },
  track: {
    height: 8,
    backgroundColor: '#F0EEF8',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});
