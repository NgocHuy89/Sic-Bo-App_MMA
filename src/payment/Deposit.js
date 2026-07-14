import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, Image, ScrollView } from 'react-native';
import api from '../services/api';

const formatVND = (n) => {
  const num = parseFloat(n);
  if (isNaN(num)) return n;
  if (Number.isInteger(num)) return num.toLocaleString('vi-VN') + ' ₫';
  return num.toLocaleString('vi-VN');
};

export default function DepositScreen({ route, navigation }) {
  const user = route?.params?.user || null;
  const [depositType, setDepositType] = useState('QR'); // 'QR' or 'BANK'
  const [amount, setAmount] = useState('');
  const [qrCode, setQrCode] = useState(null);
  const [bankInfo, setBankInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');

  useEffect(() => {
    // Random 6 chars
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setVerifyCode(code);
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/system_configs');
      const configs = res.data;
      const qrConfig = configs.find(c => c.key === 'PAYMENT_QR_CODE');
      const bankConfig = configs.find(c => c.key === 'PAYMENT_ACCOUNT_NUMBER');
      
      if (qrConfig) setQrCode(qrConfig.value);
      if (bankConfig) setBankInfo(bankConfig.value);
    } catch (e) {
      console.error(e);
      Alert.alert('Lỗi', 'Không thể tải cấu hình thanh toán');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
      return;
    }
    const numAmount = parseInt(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Lỗi', 'Số tiền nạp phải lớn hơn 0');
      return;
    }

    try {
      setSubmitting(true);
      const newTransaction = {
        user_id: user.id,
        type: 'DEPOSIT',
        amount: numAmount,
        status: 'PENDING',
        reject_reason: '',
        processed_by: null,
        verification_code: verifyCode,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await api.post('/transactions', newTransaction);
      Alert.alert('Thành công', 'Yêu cầu nạp tiền đã được gửi. Vui lòng chờ admin phê duyệt.', [
        { text: 'OK', onPress: () => { setAmount(''); navigation.navigate('Trang chủ'); } }
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi gửi yêu cầu nạp tiền');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>NẠP TIỀN</Text>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, depositType === 'QR' && styles.activeTab]}
          onPress={() => setDepositType('QR')}
        >
          <Text style={[styles.tabText, depositType === 'QR' && styles.activeTabText]}>Mã QR</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, depositType === 'BANK' && styles.activeTab]}
          onPress={() => setDepositType('BANK')}
        >
          <Text style={[styles.tabText, depositType === 'BANK' && styles.activeTabText]}>Chuyển Khoản</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        {depositType === 'QR' ? (
          <View style={styles.qrContainer}>
            <Text style={styles.infoTitle}>Quét mã QR để thanh toán</Text>
            {qrCode ? (
              <Image source={{ uri: qrCode }} style={styles.qrImage} resizeMode="contain" />
            ) : (
              <Text style={styles.noDataText}>Chưa cấu hình mã QR</Text>
            )}
            <View style={{ marginTop: 15, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 16 }}>Nội dung CK: <Text style={{ color: '#D4AF37', fontWeight: 'bold' }}>{verifyCode}</Text></Text>
              <Text style={{ color: '#aaa', fontSize: 12, marginTop: 4 }}>(nhập đúng nội dung chuyển khoản)</Text>
            </View>
          </View>
        ) : (
          <View style={styles.bankContainer}>
            <Text style={styles.infoTitle}>Thông tin chuyển khoản</Text>
            {bankInfo ? (
              <>
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>Ngân hàng:</Text>
                  <Text style={styles.bankValue}>{bankInfo.bankName || '---'}</Text>
                </View>
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>Số tài khoản:</Text>
                  <Text style={styles.bankValue}>{bankInfo.accountNumber || '---'}</Text>
                </View>
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>Chủ tài khoản:</Text>
                  <Text style={styles.bankValue}>{bankInfo.accountName || '---'}</Text>
                </View>
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>Nội dung CK:</Text>
                  <Text style={styles.bankValue}>{verifyCode}</Text>
                </View>
                <Text style={{ color: '#aaa', fontSize: 12, marginTop: -5, marginBottom: 5, fontStyle: 'italic' }}>
                  (nhập đúng nội dung chuyển khoản)
                </Text>
              </>
            ) : (
              <Text style={styles.noDataText}>Chưa cấu hình Số tài khoản</Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Số tiền muốn nạp (VNĐ)</Text>
        <TextInput
          style={styles.input}
          placeholder="Nhập số tiền..."
          placeholderTextColor="#666"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />
        {amount !== '' && !isNaN(amount) && (
          <Text style={styles.previewAmount}>= {formatVND(amount)}</Text>
        )}
      </View>

      <TouchableOpacity 
        style={[styles.submitButton, submitting && { opacity: 0.7 }]} 
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#1E0505" />
        ) : (
          <Text style={styles.submitButtonText}>GỬI YÊU CẦU NẠP TIỀN</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: '#1E0505',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#D4AF37',
    marginTop: 10,
  },
  container: {
    flexGrow: 1,
    backgroundColor: '#1E0505',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#D4AF37',
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#350A0A',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#D4AF37',
  },
  tabText: {
    color: '#A07855',
    fontWeight: '700',
    fontSize: 14,
  },
  activeTabText: {
    color: '#1E0505',
  },
  infoContainer: {
    width: '100%',
    backgroundColor: '#2A0808',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#5A2A2A',
    minHeight: 250,
    justifyContent: 'center',
  },
  infoTitle: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  qrContainer: {
    alignItems: 'center',
  },
  qrImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  bankContainer: {
    flex: 1,
  },
  bankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#350A0A',
  },
  bankLabel: {
    color: '#A07855',
    fontSize: 14,
  },
  bankValue: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  noDataText: {
    color: '#A07855',
    textAlign: 'center',
    marginTop: 20,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  inputLabel: {
    color: '#A07855',
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#350A0A',
    borderWidth: 1,
    borderColor: '#D4AF37',
    borderRadius: 10,
    color: '#FFF',
    padding: 15,
    fontSize: 16,
    fontWeight: 'bold',
  },
  previewAmount: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'right',
  },
  submitButton: {
    backgroundColor: '#D4AF37',
    width: '100%',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#1E0505',
    fontWeight: '900',
    fontSize: 16,
  },
});
