import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const formatVND = (n) => (n || 0).toLocaleString('vi-VN') + ' ₫';
const formatDateTime = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return `${dt.toLocaleDateString('vi-VN')} ${dt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
};

export default function TransactionHistory({ route, navigation }) {
  const user = route?.params?.user || {};
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTransactions = useCallback(async () => {
    try {
      let currentUserId = user?.id;
      if (!currentUserId) {
        const storedUser = await AsyncStorage.getItem('logged_in_user');
        if (storedUser) {
          currentUserId = JSON.parse(storedUser).id;
        }
      }

      if (!currentUserId) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const res = await api.get('/transactions');
      // Lọc giao dịch của user hiện tại và sắp xếp giảm dần theo ngày
      const userTx = res.data.filter(tx => String(tx.user_id) === String(currentUserId));
      const sorted = userTx.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setTransactions(sorted);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchTransactions();
    // Refresh when screen is focused
    const unsubscribe = navigation.addListener('focus', () => {
      fetchTransactions();
    });
    return unsubscribe;
  }, [fetchTransactions, navigation]);

  const renderItem = ({ item }) => {
    const isDeposit = item.type === 'DEPOSIT';
    const amountStr = (isDeposit ? '+' : '-') + formatVND(item.amount);
    
    let statusColor = '#FF9800'; // PENDING
    let statusLabel = 'Đang xử lý';
    
    if (item.status === 'COMPLETED') {
      if (item.reject_reason) {
        statusColor = '#FF4444';
        statusLabel = 'Bị từ chối';
      } else {
        statusColor = '#4CAF50';
        statusLabel = 'Thành công';
      }
    }

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardType}>{isDeposit ? '📥 NẠP TIỀN' : '📤 RÚT TIỀN'}</Text>
          <Text style={styles.cardDate}>{formatDateTime(item.created_at)}</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={[styles.cardAmount, { color: isDeposit ? '#4CAF50' : '#FF6B35' }]}>
            {amountStr}
          </Text>
          <View style={[styles.badge, { backgroundColor: statusColor + '22', borderColor: statusColor }]}>
            <Text style={[styles.badgeText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>
        {item.status === 'COMPLETED' && item.reject_reason ? (
          <View style={styles.rejectBox}>
            <Text style={styles.rejectText}>Lý do: {item.reject_reason}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>LỊCH SỬ GIAO DỊCH</Text>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#D4AF37" />
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTransactions(); }} tintColor="#D4AF37" />}
          ListEmptyComponent={<Text style={styles.emptyText}>Chưa có giao dịch nào.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E0505' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '900', color: '#D4AF37', textAlign: 'center', marginVertical: 15 },
  list: { paddingHorizontal: 15, paddingBottom: 20 },
  emptyText: { color: '#A07855', textAlign: 'center', marginTop: 30 },
  card: { backgroundColor: '#350A0A', borderRadius: 10, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: '#5A2A2A' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  cardType: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  cardDate: { color: '#A07855', fontSize: 12 },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardAmount: { fontSize: 18, fontWeight: '900' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  badgeText: { fontSize: 12, fontWeight: 'bold' },
  rejectBox: { marginTop: 10, padding: 8, backgroundColor: '#3D1B1B', borderRadius: 6 },
  rejectText: { color: '#FF4444', fontSize: 12, fontStyle: 'italic' },
});
