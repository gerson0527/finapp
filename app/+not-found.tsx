import { Link, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import SText from '@/src/components/SText';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <SText variant="title2">Esta pantalla no existe.</SText>
        <Link href="/" style={styles.link}>
          <SText variant="callout" color="#AAFF00">Ir al inicio</SText>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: '#0D0D0D' },
  link: { marginTop: 15, paddingVertical: 15 },
});
