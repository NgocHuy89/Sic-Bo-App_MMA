import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AdminScreen({ navigation, route }) {
  const user = route?.params?.user || {};

  const handleLogout = async () => {
    await AsyncStorage.removeItem('logged_in_user');
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>TRANG QUẢN TRỊ</Text>
        <Text style={styles.subtitle}>Xin chào, Admin {user.full_name || ''}</Text>
        <Text style={styles.message}>
          Giao diện và chức năng dành riêng cho Admin đang được phát triển...
        </Text>
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Đăng Xuất</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E0505',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#350A0A',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#D4AF37',
    width: '90%',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#D4AF37',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#FFF',
    marginBottom: 30,
  },
  message: {
    fontSize: 16,
    color: '#F9E596',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  logoutButton: {
    backgroundColor: '#A020F0',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 15,
  },
  logoutButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
