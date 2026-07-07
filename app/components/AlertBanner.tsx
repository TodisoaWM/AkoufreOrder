import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type AlertVariant = 'warning' | 'success' | 'error' | 'info';

interface AlertBannerProps {
  message: string;
  variant?: AlertVariant;
  icon?: string;
}

const VARIANT_STYLES: Record<AlertVariant, { bg: string; text: string; border: string }> = {
  warning: { bg: '#FFF8EC', text: '#A05F00', border: '#EF9F27' },
  success: { bg: '#E1F5EE', text: '#1A6649', border: '#5DCAA5' },
  error: { bg: '#FDEAEA', text: '#9B1B1B', border: '#E24B4A' },
  info: { bg: '#EEEEFF', text: '#3B3799', border: '#7F77DD' },
};

const DEFAULT_ICONS: Record<AlertVariant, string> = {
  warning: '⚠️',
  success: '✅',
  error: '🚨',
  info: 'ℹ️',
};

export default function AlertBanner({ message, variant = 'warning', icon }: AlertBannerProps) {
  const style = VARIANT_STYLES[variant];
  const displayIcon = icon || DEFAULT_ICONS[variant];

  return (
    <View style={[styles.banner, { backgroundColor: style.bg, borderLeftColor: style.border }]}>
      <Text style={styles.icon}>{displayIcon}</Text>
      <Text style={[styles.message, { color: style.text }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
    marginTop: 1,
  },
  message: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
});
