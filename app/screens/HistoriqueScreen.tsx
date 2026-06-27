import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import HistoryRow from '../components/HistoryRow';
import StatusBadge from '../components/StatusBadge';
import { Commande } from '../types';
import { getCommandes } from '../services/api';
import { formatKg } from '../services/format';

interface HistoriqueScreenProps {}

const MOCK_COMMANDES: Commande[] = [
  {
    id: 1,
    dateCommande: new Date(Date.now() - 3 * 86400000).toISOString(),
    dateLivraison: new Date(Date.now() - 2 * 86400000).toISOString(),
    statut: 'Soumis',
    coefficient: 1.0,
    totalUnites: 287,
    lignes: [],
  },
  {
    id: 2,
    dateCommande: new Date(Date.now() - 6 * 86400000).toISOString(),
    dateLivraison: new Date(Date.now() - 3 * 86400000).toISOString(),
    statut: 'Modifiée',
    coefficient: 1.5,
    totalUnites: 412,
    lignes: [],
  },
  {
    id: 3,
    dateCommande: new Date(Date.now() - 9 * 86400000).toISOString(),
    dateLivraison: new Date(Date.now() - 8 * 86400000).toISOString(),
    statut: 'Manqué',
    coefficient: 1.0,
    totalUnites: 0,
    lignes: [],
  },
  {
    id: 4,
    dateCommande: new Date(Date.now() - 10 * 86400000).toISOString(),
    dateLivraison: new Date(Date.now() - 9 * 86400000).toISOString(),
    statut: 'Soumis',
    coefficient: 1.0,
    totalUnites: 301,
    lignes: [],
  },
];

export default function HistoriqueScreen(_props: HistoriqueScreenProps) {
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Commande | null>(null);

  useEffect(() => {
    loadCommandes();
  }, []);

  const loadCommandes = async () => {
    setLoading(true);
    try {
      const data = await getCommandes();
      setCommandes(data.length > 0 ? data : MOCK_COMMANDES);
    } catch {
      setCommandes(MOCK_COMMANDES);
    } finally {
      setLoading(false);
    }
  };

  const formatDateFull = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F6FC" />

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#7F77DD" />
        </View>
      ) : (
        <FlatList
          data={commandes}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <HistoryRow commande={item} onPress={setSelected} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Historique</Text>
              <Text style={styles.headerSub}>{commandes.length} commandes</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>Aucune commande enregistrée.</Text>
            </View>
          }
          ListFooterComponent={<View style={{ height: 16 }} />}
        />
      )}

      {/* Detail modal */}
      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelected(null)}>
        {selected && (
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Détail commande</Text>
              <TouchableOpacity onPress={() => setSelected(null)} style={styles.modalClose}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <View style={styles.modalMeta}>
                <View style={styles.modalMetaRow}>
                  <Text style={styles.metaLabel}>Date commande</Text>
                  <Text style={styles.metaValue}>{formatDateFull(selected.dateCommande)}</Text>
                </View>
                <View style={styles.modalMetaRow}>
                  <Text style={styles.metaLabel}>Livraison</Text>
                  <Text style={styles.metaValue}>{formatDateFull(selected.dateLivraison)}</Text>
                </View>
                <View style={styles.modalMetaRow}>
                  <Text style={styles.metaLabel}>Statut</Text>
                  <StatusBadge statut={selected.statut} />
                </View>
                <View style={styles.modalMetaRow}>
                  <Text style={styles.metaLabel}>Coefficient</Text>
                  <Text style={styles.metaValue}>×{selected.coefficient}</Text>
                </View>
                <View style={styles.modalMetaRow}>
                  <Text style={styles.metaLabel}>Total</Text>
                  <Text style={[styles.metaValue, styles.metaTotal]}>{formatKg(selected.totalUnites)} kg</Text>
                </View>
              </View>

              {selected.lignes.length === 0 && (
                <Text style={styles.noLignes}>Détail des lignes non disponible.</Text>
              )}

              {selected.lignes.map((ligne, i) => (
                <View key={i} style={styles.ligneRow}>
                  <View style={styles.ligneInfo}>
                    <Text style={styles.ligneArticle}>{ligne.produit.article}</Text>
                    <Text style={styles.ligneCode}>{ligne.produit.code}</Text>
                  </View>
                  <Text style={styles.ligneQty}>{formatKg(ligne.quantite)} kg</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F6FC',
  },
  header: {
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EEF8',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1a2e',
  },
  headerSub: {
    fontSize: 12,
    color: '#9A97B0',
    marginTop: 2,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#9A97B0',
  },
  modal: {
    flex: 1,
    backgroundColor: '#F7F6FC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EEF8',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1a2e',
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F7F6FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 14,
    color: '#9A97B0',
    fontWeight: '700',
  },
  modalContent: {
    padding: 20,
  },
  modalMeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  modalMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EEF8',
  },
  metaLabel: {
    fontSize: 13,
    color: '#9A97B0',
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 13,
    color: '#1a1a2e',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  metaTotal: {
    fontWeight: '800',
    color: '#7F77DD',
    fontSize: 15,
  },
  noLignes: {
    fontSize: 13,
    color: '#9A97B0',
    textAlign: 'center',
    marginTop: 8,
  },
  ligneRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
  },
  ligneInfo: {
    flex: 1,
    marginRight: 12,
  },
  ligneArticle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  ligneCode: {
    fontSize: 11,
    color: '#9A97B0',
    marginTop: 1,
  },
  ligneQty: {
    fontSize: 16,
    fontWeight: '800',
    color: '#7F77DD',
  },
});
