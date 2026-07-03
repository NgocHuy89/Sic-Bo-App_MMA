import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

let BASE_URL = 'http://localhost:3000'; // Mặc định an toàn

if (Platform.OS === 'web') {
  BASE_URL = `http://${window.location.hostname}:3000`;
} else {
  // Ở các phiên bản Expo mới, NativeModules.SourceCode.scriptURL có thể bị undefined
  // Chúng ta chuyển sang dùng Constants.expoConfig.hostUri (chuẩn Expo)
  const hostUri = Constants?.expoConfig?.hostUri;
  
  console.log("=== DEBUG API ===");
  console.log("Host URI từ Expo:", hostUri);

  if (hostUri) {
    let ipAddress = hostUri.match(/^([^:]+)/)?.[1];
    
    if (ipAddress) {
      if ((ipAddress === 'localhost' || ipAddress === '127.0.0.1') && Platform.OS === 'android') {
        ipAddress = '10.0.2.2';
      }
      BASE_URL = `http://${ipAddress}:3000`;
    }
  } else if (Platform.OS === 'android') {
    // Nếu hostUri vẫn undefined và đang chạy Android, ép cứng IP cho máy ảo làm phương án dự phòng
    BASE_URL = 'http://10.0.2.2:3000';
  }

  console.log("Resolved BASE_URL:", BASE_URL);
  console.log("=================");
}




const api = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
