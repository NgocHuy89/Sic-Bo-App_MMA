import axios from 'axios';

// LƯU Ý: Bạn CẦN thay đổi IP này thành địa chỉ IPv4 máy tính của bạn
// Ví dụ: 192.168.1.14 (Mở cmd và gõ ipconfig để xem IPv4 Address)
// Không dùng 'localhost' nếu chạy trên máy ảo/điện thoại thật
import { Platform, NativeModules } from 'react-native';

let BASE_URL = 'http://localhost:3000'; // Mặc định an toàn cho máy ảo

if (Platform.OS === 'web') {
  // Trên web, tự động lấy IP của trình duyệt
  BASE_URL = `http://${window.location.hostname}:3000`;
} else {
  // Lấy trực tiếp địa chỉ IP mà app đã dùng để tải Javascript 
  const scriptURL = NativeModules.SourceCode.scriptURL;
  if (scriptURL) {
    // Tách lấy dải IP từ chuỗi (VD: http://192.168.1.15:8081/... -> 192.168.1.15)
    const match = scriptURL.match(/^https?:\/\/([^:/]+)/);
    if (match) {
      const ipAddress = match[1];
      BASE_URL = `http://${ipAddress}:3000`;
    }
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
