import { Redirect } from 'expo-router';

/** Ruta legacy: redirige a la pestaña Ahorros */
export default function SavingsRedirect() {
  return <Redirect href="/(tabs)/savings" />;
}
