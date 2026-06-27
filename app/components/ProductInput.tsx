import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Produit } from '../types';
import { formatKg } from '../services/format';

interface ProductInputProps {
  produit: Produit;
  value: number;
  onChangeValue: (code: string, value: number) => void;
  formulaHint?: string;
  accentColor?: string;
}

export default function ProductInput({
  produit,
  value,
  onChangeValue,
  formulaHint,
  accentColor = '#7F77DD',
}: ProductInputProps) {
  // État texte local pour permettre la saisie fluide de décimales (« 0, », « 1,2 »…)
  const [text, setText] = useState(value === 0 ? '' : formatKg(value));

  // Synchronise si la valeur change depuis l'extérieur (ex : suggestion calculée)
  useEffect(() => {
    const parsedLocal = parseFloat(text.replace(',', '.'));
    if (value !== (isNaN(parsedLocal) ? 0 : parsedLocal)) {
      setText(value === 0 ? '' : formatKg(value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleChange = (raw: string) => {
    // On autorise chiffres + un seul séparateur décimal (, ou .)
    let cleaned = raw.replace(/[^0-9.,]/g, '').replace(/\./g, ',');
    const parts = cleaned.split(',');
    if (parts.length > 2) {
      cleaned = parts[0] + ',' + parts.slice(1).join('');
    }
    // Maximum 2 décimales
    const [entier, dec] = cleaned.split(',');
    if (dec !== undefined) {
      cleaned = entier + ',' + dec.slice(0, 2);
    }

    setText(cleaned);
    const parsed = parseFloat(cleaned.replace(',', '.'));
    onChangeValue(produit.code, isNaN(parsed) ? 0 : parsed);
  };

  return (
    <View style={styles.row}>
      <View style={styles.info}>
        <Text style={styles.article} numberOfLines={1} ellipsizeMode="tail">
          {produit.article}
        </Text>
        <Text style={styles.code}>{produit.code}</Text>
        {formulaHint ? <Text style={styles.formula}>{formulaHint}</Text> : null}
      </View>
      <View style={[styles.inputWrapper, { borderColor: accentColor }]}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={handleChange}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor="#BCBAC8"
          maxLength={7}
          selectTextOnFocus
        />
        <Text style={styles.unit}>kg</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EEF8',
    backgroundColor: '#FFFFFF',
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  article: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  code: {
    fontSize: 11,
    color: '#9A97B0',
    marginTop: 1,
  },
  formula: {
    fontSize: 10,
    color: '#7F77DD',
    marginTop: 2,
    fontStyle: 'italic',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 10,
    width: 90,
    height: 40,
    justifyContent: 'flex-end',
    paddingHorizontal: 8,
    overflow: 'hidden',
  },
  input: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0, // indispensable sur le web pour empêcher l'<input> de déborder
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
    textAlign: 'right',
    padding: 0,
    // @ts-ignore — propriété web (react-native-web) pour retirer le liseré de focus
    outlineStyle: 'none',
  },
  unit: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9A97B0',
    marginLeft: 4,
  },
});
