import axios from 'axios';

// LƯU Ý: Bạn CẦN thay đổi IP này thành địa chỉ IPv4 máy tính của bạn
// Ví dụ: 192.168.1.14 (Mở cmd và gõ ipconfig để xem IPv4 Address)
// Không dùng 'localhost' nếu chạy trên máy ảo/điện thoại thật
import { Platform, NativeModules } from 'react-native';

let BASE_URL = 'http://localhost:3000'; // Fallback

if (Platform.OS === 'web') {
  // Trên web, tự động lấy IP của trình duyệt
  BASE_URL = `http://${window.location.hostname}:3000`;
} else {
  // Trên điện thoại, tự động lấy IP mạng LAN từ Metro Bundler (Expo)
  try {
    const scriptURL = NativeModules.SourceCode.scriptURL;
    if (scriptURL) {
      const ipAddress = scriptURL.split('://')[1].split(':')[0];
      BASE_URL = `http://${ipAddress}:3000`;
    }
  } catch (e) {
    console.log("Không thể tự động lấy IP, dùng localhost");
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
