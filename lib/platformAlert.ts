import { Alert, Platform } from 'react-native';

/** Alerta que funciona en web y nativo. */
export function showAlert(title: string, message?: string) {
  const text = message ? `${title}\n\n${message}` : title;
  if (Platform.OS === 'web') {
    window.alert(text);
    return;
  }
  Alert.alert(title, message);
}

/** Confirmación que funciona en web y nativo. */
export function showConfirm(
  title: string,
  message: string,
  onConfirm: () => void | Promise<void>,
  options?: { confirmText?: string; cancelText?: string; destructive?: boolean }
): void {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) {
      void onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: options?.cancelText ?? 'Cancelar', style: 'cancel' },
    {
      text: options?.confirmText ?? 'Confirmar',
      style: options?.destructive ? 'destructive' : 'default',
      onPress: () => {
        void onConfirm();
      },
    },
  ]);
}
