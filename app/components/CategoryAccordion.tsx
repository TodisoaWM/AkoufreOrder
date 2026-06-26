import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Produit } from '../types';
import { CATEGORY_COLORS } from '../data/produits';
import ProductInput from './ProductInput';

interface CategoryAccordionProps {
  categorie: string;
  produits: Produit[];
  values: Record<string, number>;
  onChangeValue: (code: string, value: number) => void;
  formulaHints?: Record<string, string>;
  defaultOpen?: boolean;
}

export default function CategoryAccordion({
  categorie,
  produits,
  values,
  onChangeValue,
  formulaHints = {},
  defaultOpen = false,
}: CategoryAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const accentColor = CATEGORY_COLORS[categorie] || '#7F77DD';

  const totalCategory = produits.reduce((sum, p) => sum + (values[p.code] || 0), 0);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.header, { borderLeftColor: accentColor }]}
        onPress={() => setIsOpen((prev) => !prev)}
        activeOpacity={0.7}
      >
        <View style={[styles.colorDot, { backgroundColor: accentColor }]} />
        <Text style={styles.categorieText}>{categorie}</Text>
        <View style={styles.right}>
          {totalCategory > 0 && (
            <View style={[styles.badge, { backgroundColor: accentColor }]}>
              <Text style={styles.badgeText}>{totalCategory}</Text>
            </View>
          )}
          <Text style={[styles.chevron, { color: accentColor }]}>{isOpen ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.content}>
          {produits.map((produit) => (
            <ProductInput
              key={produit.code}
              produit={produit}
              value={values[produit.code] || 0}
              onChangeValue={onChangeValue}
              formulaHint={formulaHints[produit.code]}
              accentColor={accentColor}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderLeftWidth: 4,
    backgroundColor: '#FFFFFF',
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  categorieText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#1a1a2e',
    letterSpacing: 0.3,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  chevron: {
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    borderTopWidth: 1,
    borderTopColor: '#F0EEF8',
  },
});
