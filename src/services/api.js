import axios from 'axios';

// LƯU Ý: Bạn CẦN thay đổi IP này thành địa chỉ IPv4 máy tính của bạn
// Ví dụ: 192.168.1.14 (Mở cmd và gõ ipconfig để xem IPv4 Address)
// Không dùng 'localhost' nếu chạy trên máy ảo/điện thoại thật
const BASE_URL = 'http://192.168.1.14:3000'; 

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
