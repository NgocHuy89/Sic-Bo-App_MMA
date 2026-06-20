import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function WithdrawScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>RÚT TIỀN</Text>
      <Text style={styles.subtitle}>Tính năng đang phát triển</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E0505',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#A07855',
  },
});
