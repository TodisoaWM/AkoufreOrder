import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { TabName } from '../types';

interface FooterNavProps {
  activeTab: TabName;
  onTabPress: (tab: TabName) => void;
}

interface TabItem {
  name: TabName;
  icon: string;
  label: string;
  isCentral?: boolean;
}

const TABS: TabItem[] = [
  { name: 'Accueil', icon: '🏠', label: 'Accueil' },
  { name: 'Stock', icon: '📦', label: 'Stock' },
  { name: 'Commande', icon: '🛒', label: 'Commande', isCentral: true },
  { name: 'Historique', icon: '📋', label: 'Historique' },
  { name: 'Stats', icon: '📊', label: 'Stats' },
];

export default function FooterNav({ activeTab, onTabPress }: FooterNavProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.name;

          if (tab.isCentral) {
            return (
              <View key={tab.name} style={styles.centralWrapper}>
                <TouchableOpacity
                  style={styles.centralButton}
                  onPress={() => onTabPress(tab.name)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.centralIcon}>{tab.icon}</Text>
                </TouchableOpacity>
                <Text style={[styles.tabLabel, { color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.4)' }]}>
                  {tab.label}
                </Text>
              </View>
            );
          }

          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tabItem}
              onPress={() => onTabPress(tab.name)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabIcon, { opacity: isActive ? 1 : 0.4 }]}>{tab.icon}</Text>
              <Text style={[styles.tabLabel, { color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.4)' }]}>
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
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
    paddingTop: 20,
    backgroundColor: '#F7F6FC',
  },
  container: {
    flexDirection: 'row',
    backgroundColor: '#1a0533',
    borderRadius: 28,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'flex-end',
    shadowColor: '#1a0533',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 4,
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
  centralWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 4,
  },
  centralButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EF9F27',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -40,
    borderWidth: 4,
    borderColor: '#1a0533',
    shadowColor: '#EF9F27',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 10,
  },
  centralIcon: {
    fontSize: 26,
  },
});
