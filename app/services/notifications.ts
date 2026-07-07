import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('commandes', {
      name: 'Rappels commande',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleCommandeReminder(hour: number = 16, minute: number = 0): Promise<string> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'AkoufréOrder — Rappel commande',
      body: 'N\'oubliez pas de saisir votre stock et soumettre la commande du jour.',
      data: { screen: 'Stock' },
    },
    trigger: {
      hour,
      minute,
      repeats: true,
    } as Notifications.DailyTriggerInput,
  });

  return id;
}

export async function sendCommandeConfirmation(totalUnites: number, dateLivraison: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Commande envoyée',
      body: `${totalUnites} unités commandées — livraison ${dateLivraison}.`,
      data: { screen: 'Historique' },
    },
    trigger: null,
  });
}

export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
