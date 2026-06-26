import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { TabName } from '../types';

interface FooterNavProps {
  activeTab: TabName;
  onTabPress: (tab: TabName) => void;
}

const COLORS = {
  dark: '#1a0533',
  gold: '#EF9F27',
  inactive: 'rgba(255,255,255,0.4)',
  active: '#FFFFFF',
};

interface TabItem {
  name: TabName;
  icon: string;
  label: string;
  isCentral?: boolean;
}

const TABS: TabItem[] = [
  { name: 'Accueil', icon: '🏠', label: 'Accueil' },
  { name: 'Stock', icon: '📦', label: 'Stock' },
  { name: 'Commande', icon: '🛒', label: 'COMMANDE', isCentral: true },
  { name: 'Historique', icon: '📋', label: 'Historique' },
  { name: 'Stats', icon: '📊', label: 'Stats' },
];

export default function FooterNav({ activeTab, onTabPress }: FooterNavProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {TABS.map((tab) => {
          if (tab.isCentral) {
            return (
              <TouchableOpacity
                key={tab.name}
                style={styles.centralButton}
                onPress={() => onTabPress(tab.name)}
                activeOpacity={0.85}
              >
                <Text style={styles.centralIcon}>{tab.icon}</Text>
              </TouchableOpacity>
            );
          }

          const isActive = activeTab === tab.name;
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tabItem}
              onPress={() => onTabPress(tab.name)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabIcon, { opacity: isActive ? 1 : 0.4 }]}>{tab.icon}</Text>
              <Text style={[styles.tabLabel, { color: isActive ? COLORS.active : COLORS.inactive }]}>
                {tab.label}
              </Text>
              {isActive && <View style={styles.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    backgroundColor: 'transparent',
    pointerEvents: 'box-none',
  },
  container: {
    flexDirection: 'row',
    backgroundColor: '#1a0533',
    borderRadius: 28,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabIcon: {
    fontSize: 22,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#EF9F27',
    marginTop: 3,
  },
  centralButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EF9F27',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
    borderWidth: 4,
    borderColor: '#1a0533',
    shadowColor: '#EF9F27',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  centralIcon: {
    fontSize: 24,
  },
});
