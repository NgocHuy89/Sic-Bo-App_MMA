import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';

const formatVND = (n) => (n || 0).toLocaleString('vi-VN') + ' ₫';
const formatDateTime = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('vi-VN');
};

export default function ProfileScreen({ route, navigation }) {
  const initialUser = route?.params?.user || {};
  const [user, setUser] = useState(initialUser);
  const [loading, setLoading] = useState(false);

  const fetchUser = useCallback(async () => {
    if (!initialUser?.id) return;
    try {
      setLoading(true);
      const res = await api.get(`/users/${initialUser.id}`);
      if (res.data) setUser(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [initialUser?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchUser();
    }, [fetchUser])
  );

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('logged_in_user');
      navigation.navigate('Login');
    } catch (error) {
      console.log('Logout error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>HỒ SƠ CỦA TÔI</Text>

      <View style={styles.infoCard}>
        {loading && !user.id ? (
           <ActivityIndicator size="large" color="#D4AF37" />
        ) : (
          <>
            <InfoRow label="Tên hiển thị" value={user.full_name || '—'} />
            <InfoRow label="Tên đăng nhập" value={user.username || '—'} />
            <InfoRow label="Số điện thoại" value={user.phone_number || '—'} />
            <InfoRow label="Ngày tham gia" value={formatDateTime(user.created_at)} />
            <View style={styles.divider} />
            <InfoRow label="Số dư" value={formatVND(user.balance)} valueStyle={styles.balanceText} />
          </>
        )}
      </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>ĐĂNG XUẤT</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, valueStyle }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueStyle]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1E0505',
  },
  scrollContainer: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#D4AF37',
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: '#350A0A',
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#5A2A2A',
    width: '100%',
    marginBottom: 30,
    minHeight: 180,
    justifyContent: 'center'
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  infoLabel: {
    color: '#A07855',
    fontSize: 15,
  },
  infoValue: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  balanceText: {
    color: '#D4AF37',
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#5A2A2A',
    marginVertical: 10,
  },
  logoutButton: {
    backgroundColor: '#D4AF37',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#1E0505',
    fontWeight: '900',
    fontSize: 16,
  },
});
