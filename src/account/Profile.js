import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen({ navigation }) {
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('logged_in_user');
      navigation.navigate('Login');
    } catch (error) {
      console.log('Logout error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>HỒ SƠ</Text>
      <View style={styles.infoCard}>
        <Text style={styles.infoText}>Tên: Người chơi 1</Text>
        <Text style={styles.infoText}>Số dư: 10,000,000 VND</Text>
      </View>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>ĐĂNG XUẤT</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E0505',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 30,
  },
  infoCard: {
    backgroundColor: '#350A0A',
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#D4AF37',
    width: '100%',
    marginBottom: 30,
  },
  infoText: {
    color: '#FFF',
    fontSize: 18,
    marginBottom: 10,
  },
  logoutButton: {
    backgroundColor: '#D4AF37',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#1E0505',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
