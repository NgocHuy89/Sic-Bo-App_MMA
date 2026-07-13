import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// ===== BẬT TÍNH NĂNG CHẠY TỪ XA QUA MẠNG PUBLIC =====
// Bạn hãy thay thế đường link bên dưới bằng link được sinh ra từ lệnh `npx localtunnel --port 3000`
let BASE_URL = 'https://canning-squid-reliant.ngrok-free.dev'; 
// =====================================================

/* --- Code cũ tự động tìm IP LAN (Đã comment lại để dùng URL public) ---
let BASE_URL = 'http://localhost:3000'; 

if (Platform.OS === 'web') {
  BASE_URL = `http://${window.location.hostname}:3000`;
} else {
  const hostUri = Constants?.expoConfig?.hostUri;
  if (hostUri) {
    let ipAddress = hostUri.match(/^([^:]+)/)?.[1];
    if (ipAddress) {
      if ((ipAddress === 'localhost' || ipAddress === '127.0.0.1') && Platform.OS === 'android') {
        ipAddress = '10.0.2.2';
      }
      BASE_URL = `http://${ipAddress}:3000`;
    }
  } else if (Platform.OS === 'android') {
    BASE_URL = 'http://10.0.2.2:3000';
  }
}
------------------------------------------------------------------------ */

console.log("Resolved BASE_URL:", BASE_URL);

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // Tăng lên 10s do kết nối qua tunnel có thể chậm hơn mạng LAN
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true', // Bắt buộc đối với localtunnel để bypass trang cảnh báo
  },
});

export default api;