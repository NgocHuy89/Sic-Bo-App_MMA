import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import api from '../services/api';

function formatVND(n) {
  return n?.toLocaleString('vi-VN') + ' ₫';
}

export default function AdminTopUsers() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [topUsers, setTopUsers] = useState([]);

  const fetchTopUsers = useCallback(async () => {
    try {
      const response = await api.get('/users');
      const users = response.data;
      
      const sortedUsers = users
        .filter(u => u.role === 'CUSTOMER')
        .sort((a, b) => (b.balance || 0) - (a.balance || 0))
        .slice(0, 10);
        
      setTopUsers(sortedUsers);
    } catch (e) {
      console.error('Fetch top users error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTopUsers();
  }, [fetchTopUsers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTopUsers();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" />}
    >
      <Text style={styles.pageTitle}>🏆 TOP 10 SỐ DƯ CAO NHẤT</Text>
      
      <View style={styles.card}>
        {topUsers.length > 0 ? (
          topUsers.map((user, index) => (
            <View key={user.id} style={styles.row}>
              <Text style={styles.rank}>#{index + 1}</Text>
              <Text style={styles.name} numberOfLines={1}>
                {user.full_name || user.username || 'Ẩn danh'}
              </Text>
              <Text style={styles.balance}>{formatVND(user.balance || 0)}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noData}>Chưa có dữ liệu người chơi</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E0505' },
  content: { padding: 16 },
  center: { flex: 1, backgroundColor: '#1E0505', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#D4AF37', marginTop: 12, fontSize: 14 },
  pageTitle: { fontSize: 16, fontWeight: '900', color: '#D4AF37', textAlign: 'center', marginBottom: 16, marginTop: 6 },
  card: { 
    backgroundColor: '#350A0A', 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#D4AF37', 
    padding: 16 
  },
  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#2A0808' 
  },
  rank: { color: '#D4AF37', fontSize: 16, fontWeight: '900', width: 40 },
  name: { color: '#F9E596', fontSize: 16, flex: 1, marginLeft: 8 },
  balance: { color: '#4CAF50', fontSize: 16, fontWeight: '700' },
  noData: { color: '#A07855', textAlign: 'center', fontSize: 14, marginVertical: 20 },
});
