import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Produit } from '../types';

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
  const handleChange = (text: string) => {
    const parsed = parseInt(text.replace(/[^0-9]/g, ''), 10);
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
          value={value === 0 ? '' : String(value)}
          onChangeText={handleChange}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor="#BCBAC8"
          maxLength={5}
          selectTextOnFocus
        />
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
    borderWidth: 1.5,
    borderRadius: 10,
    width: 72,
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  input: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
    textAlign: 'center',
  },
});
