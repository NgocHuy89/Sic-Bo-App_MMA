import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Modal,
  TextInput, ScrollView,
} from 'react-native';
import api from '../services/api';

// ─── Helpers ───────────────────────────────────────────────────────────────────
const formatVND = (n) => (n || 0).toLocaleString('vi-VN') + ' ₫';
const formatDateTime = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return `${dt.toLocaleDateString('vi-VN')} ${dt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
};

const STATUS_CONFIG = {
  PENDING:   { label: 'Chờ duyệt',  color: '#FF9800', bg: '#3D2800' },
  COMPLETED: { label: 'Hoàn thành', color: '#4CAF50', bg: '#1B3D1B' },
};

const TYPE_CONFIG = {
  DEPOSIT:  { label: 'NẠP TIỀN', color: '#4CAF50', icon: '⬆️' },
  WITHDRAW: { label: 'RÚT TIỀN', color: '#FF6B35', icon: '⬇️' },
};

// ─── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ tx }) {
  if (tx.status === 'PENDING') {
    return (
      <View style={[badge.box, { backgroundColor: '#3D2800' }]}>
        <Text style={[badge.text, { color: '#FF9800' }]}>Chờ duyệt</Text>
      </View>
    );
  }
  if (tx.status === 'COMPLETED') {
    if (tx.reject_reason) {
      return (
        <View style={[badge.box, { backgroundColor: '#3D1B1B' }]}>
          <Text style={[badge.text, { color: '#FF4444' }]}>Từ chối</Text>
        </View>
      );
    }
    return (
      <View style={[badge.box, { backgroundColor: '#1B3D1B' }]}>
        <Text style={[badge.text, { color: '#4CAF50' }]}>Đã duyệt</Text>
      </View>
    );
  }
  return null;
}

// ─── Reject Modal ──────────────────────────────────────────────────────────────
function RejectModal({ visible, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const QUICK_REASONS = [
    'Thông tin không hợp lệ',
    'Tài khoản ngân hàng không đúng',
    'Số dư không đủ',
    'Giao dịch đáng ngờ',
  ];

  const handleConfirm = () => {
    if (!reason.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập lý do từ chối.');
      return;
    }
    onConfirm(reason.trim());
    setReason('');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} supportedOrientations={['portrait', 'landscape', 'landscape-left', 'landscape-right']}>
      <View style={rejectModal.overlay}>
        <View style={rejectModal.box}>
          <Text style={rejectModal.title}>❌ Lý Do Từ Chối</Text>
          <Text style={rejectModal.hint}>Chọn nhanh hoặc nhập lý do:</Text>
          {QUICK_REASONS.map((r, i) => (
            <TouchableOpacity key={i} style={rejectModal.quickBtn} onPress={() => setReason(r)}>
              <Text style={rejectModal.quickText}>{r}</Text>
            </TouchableOpacity>
          ))}
          <TextInput
            style={rejectModal.input}
            placeholder="Hoặc nhập lý do khác..."
            placeholderTextColor="#666"
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={3}
          />
          <View style={rejectModal.btnRow}>
            <TouchableOpacity style={rejectModal.cancelBtn} onPress={onClose}>
              <Text style={rejectModal.cancelText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={rejectModal.confirmBtn} onPress={handleConfirm}>
              <Text style={rejectModal.confirmText}>Xác nhận từ chối</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Transaction Detail Modal ──────────────────────────────────────────────────
function TxDetailModal({ visible, tx, userName, onClose, onApprove, onReject }) {
  if (!tx) return null;
  const typeCfg = TYPE_CONFIG[tx.type] || {};
  const isPending = tx.status === 'PENDING';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} supportedOrientations={['portrait', 'landscape', 'landscape-left', 'landscape-right']}>
      <View style={detailModal.overlay}>
        <View style={detailModal.box}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={detailModal.header}>
              <Text style={detailModal.title}>📋 Chi Tiết Giao Dịch</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={detailModal.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={detailModal.amountBox}>
              <Text style={detailModal.amountIcon}>{typeCfg.icon}</Text>
              <Text style={[detailModal.amountText, { color: typeCfg.color }]}>
                {formatVND(tx.amount)}
              </Text>
              <Text style={[detailModal.typeLabel, { color: typeCfg.color }]}>{typeCfg.label}</Text>
            </View>

            <InfoRow label="Mã GD" value={`#${tx.id}`} />
            <InfoRow label="Người dùng" value={userName} />
            <InfoRow label="Trạng thái" value={<StatusBadge tx={tx} />} />
            <InfoRow label="Ngày tạo" value={formatDateTime(tx.created_at)} />
            <InfoRow label="Cập nhật" value={formatDateTime(tx.updated_at)} />
            {tx.reject_reason ? (
              <InfoRow label="Lý do từ chối" value={tx.reject_reason} accent="#FF4444" />
            ) : null}

            {tx.type === 'DEPOSIT' && tx.verification_code && (
              <InfoRow label="Nội dung CK" value={tx.verification_code} accent="#D4AF37" />
            )}

            {tx.type === 'WITHDRAW' && tx.bank_info && (
              <>
                <View style={detailModal.divider} />
                <Text style={detailModal.actionLabel}>🏦 Thông Tin Nhận Tiền</Text>
                <InfoRow label="Ngân hàng" value={tx.bank_info.bankName} />
                <InfoRow label="Số tài khoản" value={tx.bank_info.accountNumber} accent="#D4AF37" />
                <InfoRow label="Chủ tài khoản" value={tx.bank_info.accountName} />
              </>
            )}

            {isPending && (
              <>
                <View style={detailModal.divider} />
                <Text style={detailModal.actionLabel}>⚡ Hành Động</Text>
                <TouchableOpacity style={detailModal.approveBtn} onPress={() => onApprove(tx)}>
                  <Text style={detailModal.approveBtnText}>✅ Duyệt giao dịch</Text>
                </TouchableOpacity>
                <TouchableOpacity style={detailModal.rejectBtn} onPress={() => onReject(tx)}>
                  <Text style={detailModal.rejectBtnText}>❌ Từ chối giao dịch</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function InfoRow({ label, value, accent }) {
  return (
    <View style={detailModal.infoRow}>
      <Text style={detailModal.infoLabel}>{label}:</Text>
      {typeof value === 'string' || typeof value === 'number' ? (
        <Text style={[detailModal.infoValue, accent ? { color: accent } : {}]}>{value}</Text>
      ) : (
        value
      )}
    </View>
  );
}

// ─── Transaction Card ──────────────────────────────────────────────────────────
function TxCard({ tx, userName, onPress, onQuickApprove, onQuickReject }) {
  const typeCfg = TYPE_CONFIG[tx.type] || {};
  const isPending = tx.status === 'PENDING';

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(tx)} activeOpacity={0.85}>
      <View style={styles.cardRow}>
        <View style={[styles.typeIcon, { backgroundColor: typeCfg.color + '22' }]}>
          <Text style={styles.typeIconText}>{typeCfg.icon}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{userName}</Text>
          <Text style={[styles.cardType, { color: typeCfg.color }]}>{typeCfg.label}</Text>
          <Text style={styles.cardDate}>{formatDateTime(tx.created_at)}</Text>
          {tx.type === 'DEPOSIT' && tx.verification_code && (
            <Text style={{ color: '#D4AF37', fontSize: 11, marginTop: 4, fontWeight: 'bold' }}>
              ND CK: {tx.verification_code}
            </Text>
          )}
        </View>
        <View style={styles.cardRight}>
          <Text style={[styles.cardAmount, { color: typeCfg.color }]}>{formatVND(tx.amount)}</Text>
          <StatusBadge tx={tx} />
        </View>
      </View>

      {/* Quick action buttons for PENDING */}
      {isPending && (
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickApprove}
            onPress={(e) => { e.stopPropagation?.(); onQuickApprove(tx); }}
          >
            <Text style={styles.quickApproveText}>✅ Duyệt</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickReject}
            onPress={(e) => { e.stopPropagation?.(); onQuickReject(tx); }}
          >
            <Text style={styles.quickRejectText}>❌ Từ chối</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AdminTransactions({ route }) {
  const adminUser = route?.params?.user || {};
  const fixedType = route?.params?.transactionType;

  const [transactions, setTransactions] = useState([]);
  const [users, setUsers] = useState({});
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('PENDING');
  const [filterType, setFilterType] = useState(fixedType || 'ALL');
  const [selectedTx, setSelectedTx] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectVisible, setRejectVisible] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [txRes, usersRes] = await Promise.all([
        api.get('/transactions'),
        api.get('/users'),
      ]);
      const userMap = {};
      usersRes.data.forEach(u => { userMap[u.id] = u; });
      setUsers(userMap);
      // Sort: PENDING first, then by date desc
      const sorted = txRes.data.sort((a, b) => {
        if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
        if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
        return new Date(b.created_at) - new Date(a.created_at);
      });
      setTransactions(sorted);
    } catch {
      Alert.alert('Lỗi', 'Không thể tải danh sách giao dịch.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    let result = [...transactions];
    if (filterStatus !== 'ALL') result = result.filter(t => t.status === filterStatus);
    if (filterType !== 'ALL') result = result.filter(t => t.type === filterType);
    setFiltered(result);
  }, [transactions, filterStatus, filterType]);

  const getUserName = (userId) => users[userId]?.full_name || `User #${userId}`;

  const doApprove = async (tx) => {
    const user = users[tx.user_id];
    if (!user) { Alert.alert('Lỗi', 'Không tìm thấy người dùng.'); return; }

    // Kiểm tra số dư TRƯỚC khi thực hiện bất kỳ thao tác nào
    let newBalance = user.balance || 0;
    if (tx.type === 'DEPOSIT') newBalance += tx.amount;
    else if (tx.type === 'WITHDRAW') newBalance -= tx.amount;

    if (newBalance < 0) {
      Alert.alert('Lỗi', 'Số dư người dùng không đủ để rút.');
      return;
    }

    try {
      // Cập nhật balance trước để đảm bảo tính nhất quán
      await api.patch(`/users/${tx.user_id}`, { balance: newBalance });
      // Sau đó mới đánh dấu transaction là COMPLETED
      await api.patch(`/transactions/${tx.id}`, {
        status: 'COMPLETED',
        reject_reason: '',
        processed_by: adminUser.id || '1',
        updated_at: new Date().toISOString(),
      });

      setTransactions(prev =>
        prev.map(t => t.id === tx.id ? { ...t, status: 'COMPLETED', reject_reason: '', updated_at: new Date().toISOString() } : t)
      );
      setUsers(prev => ({ ...prev, [tx.user_id]: { ...prev[tx.user_id], balance: newBalance } }));
      setDetailVisible(false);
      Alert.alert('✅ Thành công', `Đã duyệt giao dịch ${tx.type === 'DEPOSIT' ? 'nạp' : 'rút'} ${formatVND(tx.amount)}.`);
    } catch {
      Alert.alert('Lỗi', 'Không thể duyệt giao dịch.');
    }
  };

  const confirmApprove = (tx) => {
    Alert.alert(
      'Xác nhận duyệt',
      `Duyệt ${tx.type === 'DEPOSIT' ? 'nạp' : 'rút'} ${formatVND(tx.amount)} cho "${getUserName(tx.user_id)}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Duyệt', onPress: () => doApprove(tx) },
      ]
    );
  };

  const openReject = (tx) => {
    setRejectTarget(tx);
    setDetailVisible(false);
    setRejectVisible(true);
  };

  const doReject = async (reason) => {
    const tx = rejectTarget;
    if (!tx) return;
    try {
      await api.patch(`/transactions/${tx.id}`, {
        status: 'COMPLETED',
        reject_reason: reason,
        processed_by: adminUser.id || '1',
        updated_at: new Date().toISOString(),
      });
      setTransactions(prev =>
        prev.map(t => t.id === tx.id ? { ...t, status: 'COMPLETED', reject_reason: reason } : t)
      );
      setRejectVisible(false);
      setRejectTarget(null);
      Alert.alert('✅ Đã từ chối', `Giao dịch đã bị từ chối.\nLý do: ${reason}`);
    } catch {
      Alert.alert('Lỗi', 'Không thể từ chối giao dịch.');
    }
  };

  const openDetail = (tx) => { setSelectedTx(tx); setDetailVisible(true); };

  const pendingCount = transactions.filter(t => t.status === 'PENDING' && (fixedType ? t.type === fixedType : true)).length;

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
      <Text style={styles.pageTitle}>
        {fixedType === 'DEPOSIT' ? '📥 QUẢN LÝ NẠP TIỀN' : fixedType === 'WITHDRAW' ? '📤 QUẢN LÝ RÚT TIỀN' : '💳 QUẢN LÝ GIAO DỊCH'}
      </Text>

      {pendingCount > 0 && (
        <View style={styles.alertBanner}>
          <Text style={styles.alertText}>⚠️ Có {pendingCount} giao dịch {fixedType === 'DEPOSIT' ? 'nạp' : fixedType === 'WITHDRAW' ? 'rút' : ''} đang chờ duyệt!</Text>
        </View>
      )}

      {/* Filter: Status */}
      <View style={styles.filterRow}>
        {['PENDING', 'COMPLETED', 'ALL'].map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.filterTab, filterStatus === s && styles.filterTabActive]}
            onPress={() => setFilterStatus(s)}
          >
            <Text style={[styles.filterTabText, filterStatus === s && styles.filterTabTextActive]}>
              {s === 'ALL' ? 'Tất cả' : s === 'COMPLETED' ? 'Đã xử lý' : 'Chờ duyệt'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Filter: Type */}
      {!fixedType && (
        <View style={styles.typeRow}>
          {['ALL', 'DEPOSIT', 'WITHDRAW'].map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.typeTab, filterType === t && styles.typeTabActive]}
              onPress={() => setFilterType(t)}
            >
              <Text style={[styles.typeTabText, filterType === t && styles.typeTabTextActive]}>
                {t === 'ALL' ? 'Tất cả' : TYPE_CONFIG[t]?.label || t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={styles.summary}>Hiển thị {filtered.length} giao dịch</Text>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TxCard
            tx={item}
            userName={getUserName(item.user_id)}
            onPress={openDetail}
            onQuickApprove={confirmApprove}
            onQuickReject={openReject}
          />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#D4AF37" />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Không có giao dịch nào</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      <TxDetailModal
        visible={detailVisible}
        tx={selectedTx}
        userName={selectedTx ? getUserName(selectedTx.user_id) : ''}
        onClose={() => setDetailVisible(false)}
        onApprove={confirmApprove}
        onReject={openReject}
      />

      <RejectModal
        visible={rejectVisible}
        onClose={() => { setRejectVisible(false); setRejectTarget(null); }}
        onConfirm={doReject}
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
  alertBanner: { backgroundColor: '#3D2800', borderWidth: 1, borderColor: '#FF9800', marginHorizontal: 10, borderRadius: 6, padding: 4, marginBottom: 4 },
  alertText: { color: '#FF9800', fontWeight: '700', textAlign: 'center', fontSize: 13 },
  filterRow: { flexDirection: 'row', marginHorizontal: 10, marginBottom: 4, gap: 4 },
  filterTab: { flex: 1, paddingVertical: 4, borderRadius: 6, backgroundColor: '#350A0A', borderWidth: 1, borderColor: '#5A2A2A', alignItems: 'center' },
  filterTabActive: { backgroundColor: '#D4AF37', borderColor: '#D4AF37' },
  filterTabText: { color: '#A07855', fontSize: 11, fontWeight: '600' },
  filterTabTextActive: { color: '#1E0505', fontWeight: '900' },
  typeRow: { flexDirection: 'row', marginHorizontal: 10, marginBottom: 4, gap: 4 },
  typeTab: { flex: 1, paddingVertical: 4, borderRadius: 6, backgroundColor: '#350A0A', borderWidth: 1, borderColor: '#5A2A2A', alignItems: 'center' },
  typeTabActive: { backgroundColor: '#5A2A2A', borderColor: '#D4AF37' },
  typeTabText: { color: '#A07855', fontSize: 12 },
  typeTabTextActive: { color: '#D4AF37', fontWeight: '700' },
  summary: { color: '#A07855', fontSize: 10, marginHorizontal: 10, marginBottom: 4 },
  card: { backgroundColor: '#350A0A', borderRadius: 10, borderWidth: 1, borderColor: '#5A2A2A', marginHorizontal: 10, marginBottom: 8, padding: 10 },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  typeIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  typeIconText: { fontSize: 20 },
  cardInfo: { flex: 1 },
  cardName: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  cardType: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  cardDate: { color: '#A07855', fontSize: 11, marginTop: 2 },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  cardAmount: { fontWeight: '900', fontSize: 15 },
  quickActions: { flexDirection: 'row', gap: 10, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#5A2A2A' },
  quickApprove: { flex: 1, backgroundColor: '#1B4D1B', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  quickApproveText: { color: '#4CAF50', fontWeight: '700', fontSize: 13 },
  quickReject: { flex: 1, backgroundColor: '#4D1B1B', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  quickRejectText: { color: '#FF4444', fontWeight: '700', fontSize: 13 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#A07855', fontSize: 15 },
});

const badge = StyleSheet.create({
  box: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  text: { fontSize: 11, fontWeight: '700' },
});

const detailModal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  box: { backgroundColor: '#1E0505', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 2, borderColor: '#D4AF37', padding: 20, maxHeight: '85%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '900', color: '#D4AF37' },
  closeBtn: { fontSize: 20, color: '#A07855', padding: 4 },
  amountBox: { alignItems: 'center', paddingVertical: 20, backgroundColor: '#350A0A', borderRadius: 12, marginBottom: 16 },
  amountIcon: { fontSize: 32, marginBottom: 4 },
  amountText: { fontSize: 28, fontWeight: '900' },
  typeLabel: { fontSize: 14, fontWeight: '700', marginTop: 4 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#350A0A' },
  infoLabel: { color: '#A07855', fontSize: 13 },
  infoValue: { color: '#FFF', fontSize: 13, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  divider: { height: 1, backgroundColor: '#5A2A2A', marginVertical: 16 },
  actionLabel: { color: '#F9E596', fontWeight: '700', fontSize: 14, marginBottom: 12 },
  approveBtn: { backgroundColor: '#1B4D1B', borderWidth: 1, borderColor: '#4CAF50', borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginBottom: 10 },
  approveBtnText: { color: '#4CAF50', fontWeight: '900', fontSize: 15 },
  rejectBtn: { backgroundColor: '#4D1B1B', borderWidth: 1, borderColor: '#FF4444', borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  rejectBtnText: { color: '#FF4444', fontWeight: '900', fontSize: 15 },
});

const rejectModal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  box: { backgroundColor: '#1E0505', borderRadius: 20, borderWidth: 2, borderColor: '#FF4444', padding: 20 },
  title: { fontSize: 18, fontWeight: '900', color: '#FF4444', marginBottom: 12, textAlign: 'center' },
  hint: { color: '#A07855', fontSize: 12, marginBottom: 10 },
  quickBtn: { backgroundColor: '#350A0A', borderRadius: 8, padding: 10, marginBottom: 6, borderWidth: 1, borderColor: '#5A2A2A' },
  quickText: { color: '#F9E596', fontSize: 13 },
  input: { backgroundColor: '#350A0A', borderRadius: 10, borderWidth: 1, borderColor: '#5A2A2A', color: '#FFF', padding: 12, fontSize: 14, marginTop: 8, marginBottom: 16, minHeight: 80, textAlignVertical: 'top' },
  btnRow: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, backgroundColor: '#350A0A', borderRadius: 10, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#5A2A2A' },
  cancelText: { color: '#A07855', fontWeight: '700' },
  confirmBtn: { flex: 1, backgroundColor: '#7B1C1C', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  confirmText: { color: '#FF4444', fontWeight: '900' },
});
