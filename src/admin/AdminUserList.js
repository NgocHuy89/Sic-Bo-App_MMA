import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Modal,
  TextInput, ScrollView,
} from 'react-native';
import api from '../services/api';

// ─── Format helpers ────────────────────────────────────────────────────────────
const formatVND = (n) => (n || 0).toLocaleString('vi-VN') + ' ₫';
const formatDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';

// ─── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const isActive = status === 'ACTIVE';
  return (
    <View style={[badge.box, { backgroundColor: isActive ? '#1B4D1B' : '#4D1B1B' }]}>
      <Text style={[badge.text, { color: isActive ? '#4CAF50' : '#FF4444' }]}>
        {isActive ? '● Hoạt động' : '● Bị khóa'}
      </Text>
    </View>
  );
}

// ─── User Detail Modal ─────────────────────────────────────────────────────────
function UserDetailModal({ visible, user, onClose, onToggleStatus, onAdjustBalance }) {
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustNote, setAdjustNote] = useState('');

  if (!user) return null;

  const handleAdjust = () => {
    const amount = parseInt(adjustAmount.replace(/\D/g, ''), 10);
    if (isNaN(amount) || amount === 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số tiền hợp lệ (khác 0).');
      return;
    }
    onAdjustBalance(user, amount, adjustNote);
    setAdjustAmount('');
    setAdjustNote('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={modal.overlay}>
        <View style={modal.box}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={modal.header}>
              <Text style={modal.title}>👤 Chi Tiết Người Dùng</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={modal.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Info rows */}
            <InfoRow label="Họ tên" value={user.full_name} />
            <InfoRow label="Tên đăng nhập" value={user.username} />
            <InfoRow label="Số điện thoại" value={user.phone_number} />
            <InfoRow label="Vai trò" value={user.role} />
            <InfoRow label="Ngày tạo" value={formatDate(user.created_at)} />
            <InfoRow label="Số dư" value={formatVND(user.balance)} accent="#D4AF37" />

            <View style={modal.divider} />

            {/* Toggle status */}
            <Text style={modal.sectionLabel}>⚙️ Trạng Thái Tài Khoản</Text>
            <StatusBadge status={user.status} />
            <TouchableOpacity
              style={[modal.actionBtn, { backgroundColor: user.status === 'ACTIVE' ? '#7B1C1C' : '#1B4D1B' }]}
              onPress={() => onToggleStatus(user)}
            >
              <Text style={modal.actionBtnText}>
                {user.status === 'ACTIVE' ? '🔒 Khóa tài khoản' : '🔓 Mở khóa tài khoản'}
              </Text>
            </TouchableOpacity>

            <View style={modal.divider} />

            {/* Adjust balance */}
            <Text style={modal.sectionLabel}>💰 Điều Chỉnh Số Dư</Text>
            <Text style={modal.hint}>Nhập số dương để cộng, số âm để trừ (VD: -50000)</Text>
            <TextInput
              style={modal.input}
              placeholder="Số tiền (VD: 100000 hoặc -50000)"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={adjustAmount}
              onChangeText={setAdjustAmount}
            />
            <TextInput
              style={modal.input}
              placeholder="Ghi chú (tuỳ chọn)"
              placeholderTextColor="#666"
              value={adjustNote}
              onChangeText={setAdjustNote}
            />
            <TouchableOpacity style={modal.actionBtn} onPress={handleAdjust}>
              <Text style={modal.actionBtnText}>✅ Xác nhận điều chỉnh</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function InfoRow({ label, value, accent }) {
  return (
    <View style={modal.infoRow}>
      <Text style={modal.infoLabel}>{label}:</Text>
      <Text style={[modal.infoValue, accent ? { color: accent } : {}]}>{value || '—'}</Text>
    </View>
  );
}

// ─── User Card ─────────────────────────────────────────────────────────────────
function UserCard({ user, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(user)} activeOpacity={0.8}>
      <View style={styles.cardTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(user.full_name || 'U')[0].toUpperCase()}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{user.full_name}</Text>
          <Text style={styles.cardUsername}>@{user.username}</Text>
          <Text style={styles.cardPhone}>📞 {user.phone_number}</Text>
        </View>
        <View style={styles.cardRight}>
          <StatusBadge status={user.status} />
          <Text style={styles.cardBalance}>{formatVND(user.balance)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AdminUserList() {
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL | ACTIVE | LOCKED
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get('/users');
      const customers = res.data.filter(u => u.role === 'CUSTOMER');
      setUsers(customers);
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể tải danh sách người dùng.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Filter & search
  useEffect(() => {
    let result = [...users];
    if (filterStatus !== 'ALL') {
      result = result.filter(u => u.status === filterStatus);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(u =>
        u.full_name?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q) ||
        u.phone_number?.includes(q)
      );
    }
    setFiltered(result);
  }, [users, search, filterStatus]);

  const openModal = (user) => {
    setSelectedUser(user);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedUser(null);
  };

  const handleToggleStatus = (user) => {
    const newStatus = user.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    const action = newStatus === 'LOCKED' ? 'khóa' : 'mở khóa';
    Alert.alert(
      'Xác nhận',
      `Bạn có chắc muốn ${action} tài khoản của "${user.full_name}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          style: newStatus === 'LOCKED' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await api.patch(`/users/${user.id}`, { status: newStatus });
              setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
              setSelectedUser(prev => prev ? { ...prev, status: newStatus } : null);
              Alert.alert('Thành công', `Đã ${action} tài khoản thành công.`);
            } catch {
              Alert.alert('Lỗi', `Không thể ${action} tài khoản.`);
            }
          },
        },
      ]
    );
  };

  const handleAdjustBalance = async (user, amount, note) => {
    const newBalance = (user.balance || 0) + amount;
    if (newBalance < 0) {
      Alert.alert('Lỗi', 'Số dư không được âm.');
      return;
    }
    const sign = amount > 0 ? '+' : '';
    Alert.alert(
      'Xác nhận điều chỉnh',
      `${sign}${amount.toLocaleString('vi-VN')} ₫ cho "${user.full_name}"\nSố dư mới: ${newBalance.toLocaleString('vi-VN')} ₫${note ? `\nGhi chú: ${note}` : ''}`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            try {
              // Cập nhật số dư user
              await api.patch(`/users/${user.id}`, { balance: newBalance });
              // Tạo transaction record để audit trail
              await api.post('/transactions', {
                user_id: user.id,
                type: amount > 0 ? 'DEPOSIT' : 'WITHDRAW',
                amount: Math.abs(amount),
                status: 'APPROVED',
                reject_reason: '',
                processed_by: 'ADMIN',
                note: note || 'Điều chỉnh thủ công bởi Admin',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
              setUsers(prev => prev.map(u => u.id === user.id ? { ...u, balance: newBalance } : u));
              setSelectedUser(prev => prev ? { ...prev, balance: newBalance } : null);
              Alert.alert('Thành công', 'Đã điều chỉnh số dư thành công.');
            } catch {
              Alert.alert('Lỗi', 'Không thể điều chỉnh số dư.');
            }
          },
        },
      ]
    );
  };

  const onRefresh = () => { setRefreshing(true); fetchUsers(); };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>👥 QUẢN LÝ NGƯỜI DÙNG</Text>

      {/* Search */}
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm theo tên, username, SĐT..."
          placeholderTextColor="#666"
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {['ALL', 'ACTIVE', 'LOCKED'].map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filterStatus === f && styles.filterTabActive]}
            onPress={() => setFilterStatus(f)}
          >
            <Text style={[styles.filterTabText, filterStatus === f && styles.filterTabTextActive]}>
              {f === 'ALL' ? 'Tất cả' : f === 'ACTIVE' ? 'Hoạt động' : 'Bị khóa'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary */}
      <Text style={styles.summary}>
        Hiển thị {filtered.length}/{users.length} người dùng
      </Text>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <UserCard user={item} onPress={openModal} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Không tìm thấy người dùng nào</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      {/* Detail Modal */}
      <UserDetailModal
        visible={modalVisible}
        user={selectedUser}
        onClose={closeModal}
        onToggleStatus={handleToggleStatus}
        onAdjustBalance={handleAdjustBalance}
      />
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E0505' },
  center: { flex: 1, backgroundColor: '#1E0505', justifyContent: 'center', alignItems: 'center' },
  pageTitle: { fontSize: 14, fontWeight: '900', color: '#D4AF37', textAlign: 'center', paddingVertical: 4 },
  loadingText: { color: '#D4AF37', marginTop: 10 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#350A0A', borderRadius: 6, borderWidth: 1, borderColor: '#D4AF37', marginHorizontal: 10, marginBottom: 4, paddingHorizontal: 8 },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, color: '#FFF', fontSize: 12, paddingVertical: 4, minHeight: 32 },
  clearBtn: { color: '#A07855', fontSize: 16, paddingLeft: 8 },
  filterRow: { flexDirection: 'row', marginHorizontal: 10, marginBottom: 4, gap: 6 },
  filterTab: { flex: 1, paddingVertical: 4, borderRadius: 6, backgroundColor: '#350A0A', borderWidth: 1, borderColor: '#5A2A2A', alignItems: 'center' },
  filterTabActive: { backgroundColor: '#D4AF37', borderColor: '#D4AF37' },
  filterTabText: { color: '#A07855', fontSize: 12, fontWeight: '600' },
  filterTabTextActive: { color: '#1E0505' },
  summary: { color: '#A07855', fontSize: 10, marginHorizontal: 10, marginBottom: 4 },
  card: { backgroundColor: '#350A0A', borderRadius: 10, borderWidth: 1, borderColor: '#5A2A2A', marginHorizontal: 10, marginBottom: 8, padding: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#D4AF37', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 20, fontWeight: '900', color: '#1E0505' },
  cardInfo: { flex: 1 },
  cardName: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  cardUsername: { color: '#A07855', fontSize: 12, marginTop: 2 },
  cardPhone: { color: '#F9E596', fontSize: 12, marginTop: 2 },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  cardBalance: { color: '#D4AF37', fontWeight: '700', fontSize: 13, marginTop: 4 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#A07855', fontSize: 15 },
});

const badge = StyleSheet.create({
  box: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  text: { fontSize: 11, fontWeight: '700' },
});

const modal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  box: { backgroundColor: '#1E0505', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 2, borderColor: '#D4AF37', padding: 20, maxHeight: '90%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '900', color: '#D4AF37' },
  closeBtn: { fontSize: 20, color: '#A07855', padding: 4 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#350A0A' },
  infoLabel: { color: '#A07855', fontSize: 13 },
  infoValue: { color: '#FFF', fontSize: 13, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  divider: { height: 1, backgroundColor: '#5A2A2A', marginVertical: 16 },
  sectionLabel: { color: '#F9E596', fontWeight: '700', fontSize: 14, marginBottom: 10 },
  hint: { color: '#A07855', fontSize: 11, marginBottom: 8 },
  input: { backgroundColor: '#350A0A', borderRadius: 10, borderWidth: 1, borderColor: '#5A2A2A', color: '#FFF', paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, marginBottom: 10 },
  actionBtn: { backgroundColor: '#D4AF37', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 4, marginBottom: 8 },
  actionBtnText: { color: '#1E0505', fontWeight: '900', fontSize: 14 },
});
