import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { supabase } from './supabaseClient';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

export async function registrarPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  const { data: token } = await Notifications.getExpoPushTokenAsync();

  const { error } = await supabase
    .from('usuario')
    .update({ push_token: token })
    .eq('id_usuario', (await supabase.auth.getUser()).data.user?.id ?? '');

  if (error) console.warn('Erro ao salvar push token:', error.message);

  return token;
}

export async function enviarNotificacaoLocal(
  titulo: string,
  corpo: string,
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { title: titulo, body: corpo },
    trigger: null,
  });
}
