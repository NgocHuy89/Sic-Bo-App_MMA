import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// ===== BẬT TÍNH NĂNG CHẠY TỪ XA QUA MẠNG PUBLIC (RENDER.COM) =====
let BASE_URL = 'https://sic-bo-api.onrender.com';
// =====================================================

/* --- Code cũ dùng ngrok hoặc IP LAN (Đã comment lại) ---
// let BASE_URL = 'https://canning-squid-reliant.ngrok-free.dev';
// let BASE_URL = 'http://localhost:3000';
------------------------------------------------------------------------ */

console.log("Resolved BASE_URL:", BASE_URL);

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000, // Tăng lên 15s do Render gói Free có thể cần thời gian khởi động (cold start)
  headers: {
    'Content-Type': 'application/json',
    // 'ngrok-skip-browser-warning': 'true', // Không còn cần thiết khi dùng Render
  },
});

export default api;