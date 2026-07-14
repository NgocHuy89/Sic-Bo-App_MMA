import { StyleSheet } from 'react-native';

// Lấy tone màu chủ đạo từ ảnh
const COLORS = {
  goldLight: '#FBE8A6',
  gold: '#E5B95C',
  goldDark: '#B8860B',
  brownDark: '#1C0B02',
  brownBoard: '#3E1E04',
  brownPanel: '#2A1104',
  redDark: '#4A0E00',
  redDice: '#D31A1A',
  purpleAllIn: '#5A186A',
  redCancel: '#7A0C0C',
};

export const getStyles = (width, height, isPortrait) => StyleSheet.create({
  // Overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  globalCloseBtn: {
    position: 'absolute',
    top: 15,
    right: 30,
    backgroundColor: COLORS.brownDark,
    borderColor: COLORS.gold,
    borderWidth: 2,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
  
  // Header / Title (TÀI XỈU)
  headerContainer: {
    alignItems: 'center',
    marginBottom: -15, // Tạo hiệu ứng đè lên khung
    zIndex: 10,
  },
  titleText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
    textShadowColor: COLORS.gold,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
    letterSpacing: 2,
  },
  timerText: {
    fontSize: 14,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 15,
    paddingVertical: 2,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  headerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 5,
  },
  balanceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#D4AF37',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  sessionText: {
    color: COLORS.goldLight,
    fontSize: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 15,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 5,
  },

  boardContainer: {
    width: width * 0.95,
    backgroundColor: COLORS.brownBoard,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: COLORS.gold,
    padding: 5,
    paddingTop: 15,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 5,
    position: 'relative',
  },

  closeButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Nội dung chính của Board (Tài - Xúc xắc - Xỉu)
  boardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: isPortrait ? 5 : 10,
  },
  boardContentPortrait: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    marginTop: 5,
  },
  doorsRowPortrait: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },

  doorPanel: {
    flex: 1,
    backgroundColor: COLORS.brownPanel,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: COLORS.goldDark,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 80,
  },
  doorPanelPortrait: {
    flex: 0,
    width: '48%',
    minHeight: 140, // Tăng chiều cao để chiếm bớt khoảng trống
  },
  doorPanelActive: {
    borderColor: COLORS.goldLight,
    borderWidth: 3,
    backgroundColor: 'rgba(229, 185, 92, 0.2)', // Ánh vàng
    shadowColor: COLORS.goldLight,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },
  doorTitle: {
    fontSize: isPortrait ? 20 : 24,
    fontWeight: '900',
    textShadowColor: COLORS.gold,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginBottom: 2,
  },
  doorTitleTai: {
    color: '#000000', // Đen cho TÀI
  },
  doorTitleXiu: {
    color: '#FFFFFF', // Trắng cho XỈU
  },
  doorTitleActive: {
    textShadowColor: COLORS.gold,
    textShadowRadius: 10,
    transform: [{scale: 1.1}], // Hiệu ứng phóng to nhẹ khi chọn
  },
  doorTotalBet: {
    backgroundColor: COLORS.redDark,
    width: '90%',
    paddingVertical: 2,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.goldDark,
    marginBottom: 2,
  },
  doorTotalBetText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  doorMyBet: {
    backgroundColor: COLORS.brownDark,
    width: '80%',
    paddingVertical: 2,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#555',
  },
  doorMyBetText: {
    color: COLORS.gold,
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Khu vực Xúc xắc ở giữa
  diceCenterContainer: {
    width: 70,
    height: 70,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 50,
    borderWidth: 3,
    borderColor: COLORS.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  diceCenterContainerPortrait: {
    width: 110, // Phóng to xúc xắc khi ở giao diện dọc
    height: 110,
    borderRadius: 55,
    marginHorizontal: 0,
    marginTop: 10,
  },
  diceIconGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
    height: 60,
  },
  diceIconGroupPortrait: {
    width: 90,
    height: 90,
  },
  diceEmoji: {
    fontSize: 24,
    margin: -2,
    color: '#FFFFFF', // Thêm màu trắng để hiển thị rõ ký tự Unicode xúc xắc trên nền đen
  },
  
  // Total bet highlight center
  centerBetHighlight: {
    position: 'absolute',
    bottom: -12,
    backgroundColor: COLORS.redDark,
    borderWidth: 1,
    borderColor: COLORS.gold,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  centerBetText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 10,
  },

  historyContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1C0B02', // Màu nền thanh lịch sử (đen mờ)
    paddingVertical: 4,
    paddingHorizontal: 15,
    borderRadius: 25,
    marginTop: 15,
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    width: width * 0.95,
  },
  historyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 4,
    borderWidth: 1.5,
    borderColor: COLORS.goldDark,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 2,
  },
  historyDotTai: {
    backgroundColor: '#000000', // Đen cho TÀI
  },
  historyDotXiu: {
    backgroundColor: '#FFFFFF', // Trắng cho XỈU
  },

  // Hàng nút Chips
  chipsWrapper: {
    marginTop: 5,
    width: width * 0.95,
  },
  chipsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
    flexWrap: isPortrait ? 'wrap' : 'nowrap',
  },
  chipButton: {
    backgroundColor: COLORS.brownPanel,
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 5,
    alignItems: 'center',
    minWidth: 40,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 3,
  },
  chipText: {
    color: COLORS.goldLight,
    fontWeight: 'bold',
    fontSize: 12,
  },

  // Khung Action Buttons dưới cùng
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: width * 0.95,
    marginTop: 5,
  },
  actionBtn: {
    paddingVertical: 8,
    borderRadius: 25,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
  allInBtn: {
    backgroundColor: COLORS.purpleAllIn,
    borderColor: '#D883FF',
    flex: 1,
    marginRight: 10,
  },
  confirmBtn: {
    backgroundColor: COLORS.goldDark,
    borderColor: COLORS.goldLight,
    flex: 1.5, // To hơn một chút
  },
  cancelBtn: {
    backgroundColor: COLORS.redCancel,
    borderColor: '#FF6B6B',
    flex: 1,
    marginLeft: 10,
  },
  actionBtnText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },
  confirmBtnText: {
    color: COLORS.brownDark,
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  }
});
