import React, { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import HomeScreen from './screens/HomeScreen';
import StockScreen from './screens/StockScreen';
import CommandeScreen from './screens/CommandeScreen';
import HistoriqueScreen from './screens/HistoriqueScreen';
import StatsScreen from './screens/StatsScreen';
import FooterNav from './components/FooterNav';
import { TabName } from './types';

export default function App() {
  const [onglet, setOnglet] = useState<TabName>('Accueil');

  const renderEcran = () => {
    switch (onglet) {
      case 'Accueil':    return <HomeScreen onNavigate={setOnglet} />;
      case 'Stock':      return <StockScreen onNavigate={setOnglet} />;
      case 'Commande':   return <CommandeScreen onNavigate={setOnglet} />;
      case 'Historique': return <HistoriqueScreen />;
      case 'Stats':      return <StatsScreen />;
    }
  };

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#1a0533" />
      <View style={styles.conteneur}>
        <View style={styles.ecran}>{renderEcran()}</View>
        <FooterNav activeTab={onglet} onTabPress={setOnglet} />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: '#F7F6FC' },
  ecran: { flex: 1 },
});
