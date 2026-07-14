import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import api from '../services/api';

const formatVND = (n) => {
  const num = parseFloat(n);
  if (isNaN(num)) return n;
  if (Number.isInteger(num)) return num.toLocaleString('vi-VN') + ' ₫';
  return num.toLocaleString('vi-VN');
};

export default function WithdrawScreen({ route, navigation }) {
  const user = route?.params?.user || null;
  
  // Bank Info state
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    const fetchLastBankInfo = async () => {
      try {
        const res = await api.get('/transactions');
        const withdraws = res.data.filter(tx => String(tx.user_id) === String(user.id) && tx.type === 'WITHDRAW');
        if (withdraws.length > 0) {
          const sorted = withdraws.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          const lastWithBank = sorted.find(t => t.bank_info);
          if (lastWithBank) {
            setBankName(lastWithBank.bank_info.bankName || '');
            setAccountNumber(lastWithBank.bank_info.accountNumber || '');
            setAccountName(lastWithBank.bank_info.accountName || '');
          }
        }
      } catch (e) {
        console.error('Failed to fetch last bank info', e);
      }
    };
    fetchLastBankInfo();
  }, [user?.id]);

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
      return;
    }
    const numAmount = parseInt(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Lỗi', 'Số tiền rút phải lớn hơn 0');
      return;
    }
    if (numAmount > user.balance) {
      Alert.alert('Lỗi', 'Số dư không đủ để thực hiện rút tiền.');
      return;
    }

    if (!bankName.trim() || !accountNumber.trim() || !accountName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin tài khoản ngân hàng.');
      return;
    }

    const bankInfo = {
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      accountName: accountName.trim()
    };

    try {
      setSubmitting(true);
      const newTransaction = {
        user_id: user.id,
        type: 'WITHDRAW',
        amount: numAmount,
        status: 'PENDING',
        payment_method: 'BANK',
        bank_info: bankInfo,
        reject_reason: '',
        processed_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Create transaction
      await api.post('/transactions', newTransaction);

      Alert.alert('Thành công', 'Yêu cầu rút tiền đã được gửi. Vui lòng chờ admin phê duyệt.', [
        { text: 'OK', onPress: () => { 
            setAmount(''); 
            setBankName('');
            setAccountNumber('');
            setAccountName('');
            navigation.navigate('Trang chủ', { user }); 
        } }
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi gửi yêu cầu rút tiền');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>RÚT TIỀN</Text>
      <Text style={styles.balanceText}>Số dư khả dụng: <Text style={styles.balanceHighlight}>{formatVND(user?.balance || 0)}</Text></Text>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Nhập thông tin nhận tiền</Text>
        <View style={styles.bankContainer}>
          <Text style={styles.inputLabel}>Tên ngân hàng (VD: MB Bank)</Text>
          <TextInput style={styles.input} placeholderTextColor="#666" placeholder="Nhập tên ngân hàng..." value={bankName} onChangeText={setBankName} />
          <Text style={styles.inputLabel}>Số tài khoản</Text>
          <TextInput style={styles.input} placeholderTextColor="#666" placeholder="Nhập số tài khoản..." keyboardType="numeric" value={accountNumber} onChangeText={setAccountNumber} />
          <Text style={styles.inputLabel}>Tên chủ tài khoản</Text>
          <TextInput style={styles.input} placeholderTextColor="#666" placeholder="Nhập tên chủ tài khoản..." value={accountName} onChangeText={setAccountName} />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Số tiền muốn rút (VNĐ)</Text>
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
          <Text style={styles.submitButtonText}>GỬI YÊU CẦU RÚT TIỀN</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: 5,
  },
  balanceText: {
    color: '#A07855',
    fontSize: 14,
    marginBottom: 20,
  },
  balanceHighlight: {
    color: '#D4AF37',
    fontWeight: 'bold',
    fontSize: 16,
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
  },
  infoTitle: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  bankContainer: {
    flex: 1,
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
    marginBottom: 10,
  },
  previewAmount: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: -2,
    marginBottom: 10,
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
