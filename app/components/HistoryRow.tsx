import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Commande } from '../types';
import StatusBadge from './StatusBadge';

interface HistoryRowProps {
  commande: Commande;
  onPress: (commande: Commande) => void;
}

export default function HistoryRow({ commande, onPress }: HistoryRowProps) {
  const dateCommande = new Date(commande.dateCommande);
  const dateLivraison = new Date(commande.dateLivraison);

  const formatDate = (d: Date) =>
    d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' });

  return (
    <TouchableOpacity style={styles.row} onPress={() => onPress(commande)} activeOpacity={0.7}>
      <View style={styles.dateBlock}>
        <Text style={styles.dateDay}>
          {dateCommande.toLocaleDateString('fr-FR', { weekday: 'short' }).toUpperCase()}
        </Text>
        <Text style={styles.dateNum}>{dateCommande.getDate()}</Text>
        <Text style={styles.dateMonth}>
          {dateCommande.toLocaleDateString('fr-FR', { month: 'short' })}
        </Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.title}>Commande du {formatDate(dateCommande)}</Text>
        <Text style={styles.subtitle}>
          Livraison {formatDate(dateLivraison)} · {commande.totalUnites} unités
        </Text>
        <Text style={styles.coeff}>Coeff ×{commande.coefficient}</Text>
      </View>

      <StatusBadge statut={commande.statut} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  dateBlock: {
    width: 48,
    alignItems: 'center',
    marginRight: 14,
  },
  dateDay: {
    fontSize: 9,
    fontWeight: '700',
    color: '#9A97B0',
    letterSpacing: 0.5,
  },
  dateNum: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1a2e',
    lineHeight: 26,
  },
  dateMonth: {
    fontSize: 10,
    color: '#9A97B0',
    textTransform: 'capitalize',
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a2e',
    textTransform: 'capitalize',
  },
  subtitle: {
    fontSize: 12,
    color: '#9A97B0',
    marginTop: 2,
  },
  coeff: {
    fontSize: 11,
    color: '#7F77DD',
    marginTop: 2,
    fontWeight: '600',
  },
});
