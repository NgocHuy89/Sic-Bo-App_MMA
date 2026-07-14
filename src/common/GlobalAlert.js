import React, { useState, useEffect } from 'react';
import { Alert, DeviceEventEmitter } from 'react-native';
import CustomAlert from './CustomAlert';

// Ghi đè phương thức Alert.alert mặc định của React Native
const originalAlert = Alert.alert;

Alert.alert = (title, message, buttons, options) => {
  DeviceEventEmitter.emit('SHOW_CUSTOM_ALERT', { title, message, buttons });
};

export default function GlobalAlert() {
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: []
  });

  useEffect(() => {
    const showSub = DeviceEventEmitter.addListener('SHOW_CUSTOM_ALERT', (config) => {
      setAlertConfig({
        visible: true,
        title: config.title || '',
        message: config.message || '',
        buttons: config.buttons || []
      });
    });

    const hideSub = DeviceEventEmitter.addListener('HIDE_CUSTOM_ALERT', () => {
      setAlertConfig(prev => ({ ...prev, visible: false }));
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleClose = () => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  };

  return (
    <CustomAlert
      visible={alertConfig.visible}
      title={alertConfig.title}
      message={alertConfig.message}
      buttons={alertConfig.buttons}
      onClose={handleClose}
    />
  );
}
