import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>FoulPay Mobile</Text>
      <Text style={styles.subtext}>Loading...</Text>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#22c55e',
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtext: {
    color: '#94a3b8',
    fontSize: 16,
    marginTop: 8,
  },
});
