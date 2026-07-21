import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import CustomAlert from '../common/CustomAlert';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '' });

  const showAlert = (title, message) => {
    setAlertConfig({ visible: true, title, message });
  };

  const handleLogin = async () => {
    if (!username || !password) {
      showAlert('Lỗi', 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!');
      return;
    }
    
    try {
      // Gọi API đến json-server để tìm user (chỉ query username để tránh lỗi ép kiểu trên json-server)
      const response = await api.get(`/users?username=${username}`);
      
      if (response.data && response.data.length > 0) {
        const user = response.data[0];
        
        // Kiểm tra mật khẩu ở Client
        if (user.password === password) {
          // Lưu user vào AsyncStorage
          await AsyncStorage.setItem('logged_in_user', JSON.stringify(user));

          // Đăng nhập thành công, kiểm tra role
          if (user.role === 'ADMIN') {
            navigation.replace('Admin', { user });
          } else {
            navigation.replace('Main', { user });
          }
        } else {
          showAlert('Lỗi đăng nhập', 'Tên đăng nhập hoặc mật khẩu không đúng!');
        }
      } else {
        showAlert('Lỗi đăng nhập', 'Tên đăng nhập hoặc mật khẩu không đúng!');
      }
    } catch (error) {
      console.error(error);
      showAlert('Lỗi hệ thống', 'Không thể kết nối đến máy chủ. Hãy đảm bảo Server đang chạy.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        enabled={Platform.OS === 'ios'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Tiêu đề mang phong cách Casino / Tài xỉu */}
          <View style={styles.headerContainer}>
            <Text style={styles.title}>TÀI XỈU</Text>
            <Text style={styles.subtitle}>SIC BO CASINO</Text>
          </View>

          {/* Form đăng nhập */}
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Tên Đăng Nhập</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập tên đăng nhập"
                placeholderTextColor="#A07855"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Mật Khẩu</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập mật khẩu"
                placeholderTextColor="#A07855"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>


            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>ĐĂNG NHẬP</Text>
            </TouchableOpacity>

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Chưa có tài khoản? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerLink}>Đăng ký ngay</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <CustomAlert 
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E0505', // Màu nền đỏ sậm phong cách sòng bài
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingVertical: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: '#D4AF37', // Màu vàng gold sang trọng
    letterSpacing: 2,
    textShadowColor: 'rgba(212, 175, 55, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#F9E596',
    letterSpacing: 5,
    marginTop: 5,
  },
  formContainer: {
    backgroundColor: '#350A0A', // Đỏ đô nhạt hơn một chút cho khung form
    padding: 25,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#D4AF37', // Viền vàng gold
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#D4AF37',
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Nền input hơi tối
    borderWidth: 1,
    borderColor: '#7A1C1C',
    borderRadius: 8,
    color: '#FFF',
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
  },
  forgotPassword: {
    alignItems: 'flex-end',
    marginBottom: 25,
  },
  forgotPasswordText: {
    color: '#D4AF37',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#D4AF37', // Nút bấm màu vàng nổi bật
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  loginButtonText: {
    color: '#1E0505', // Chữ trên nút màu đen/đỏ đậm
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  registerText: {
    color: '#A07855',
    fontSize: 14,
  },
  registerLink: {
    color: '#D4AF37',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
