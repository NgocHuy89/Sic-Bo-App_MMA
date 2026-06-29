import axios from 'axios';

// LƯU Ý: Bạn CẦN thay đổi IP này thành địa chỉ IPv4 máy tính của bạn
// Ví dụ: 192.168.1.14 (Mở cmd và gõ ipconfig để xem IPv4 Address)
// Không dùng 'localhost' nếu chạy trên máy ảo/điện thoại thật
import { Platform } from 'react-native';
import Constants from 'expo-constants';

let BASE_URL = 'http://localhost:3000'; // Fallback

if (Platform.OS === 'web') {
  // Trên web, tự động lấy IP của trình duyệt
  BASE_URL = `http://${window.location.hostname}:3000`;
} else {
  // Trên điện thoại, lấy IP mạng LAN chính xác từ cấu hình của Expo Go
  const hostUri = Constants.expoConfig?.hostUri || Constants.experienceUrl;
  if (hostUri) {
    // hostUri thường có dạng 192.168.x.x:8081
    const ipAddress = hostUri.replace(/^https?:\/\//, '').split(':')[0];
    BASE_URL = `http://${ipAddress}:3000`;
  } else {
    console.log("Không tìm thấy hostUri, fallback về IP cứng...");
    BASE_URL = 'http://192.168.88.152:3000';
  }
}




const api = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
