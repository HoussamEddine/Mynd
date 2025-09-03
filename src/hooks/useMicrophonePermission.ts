import { useState, useEffect, useCallback } from 'react';
import { Audio } from 'expo-av';
import { requestMicrophonePermission, showPermissionDeniedAlert, openAppSettings } from '../utils/audioPermissions';

export const useMicrophonePermission = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);

  const checkPermission = useCallback(async () => {
    try {
      const { status } = await Audio.getPermissionsAsync();
      setHasPermission(status === 'granted');
      return status === 'granted';
    } catch (error) {
      console.warn('Error checking microphone permission:', error);
      setHasPermission(false);
      return false;
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (isRequesting) return false;
    
    setIsRequesting(true);
    try {
      const granted = await requestMicrophonePermission();
      setHasPermission(granted);
      
      if (!granted) {
        showPermissionDeniedAlert(openAppSettings);
      }
      
      return granted;
    } catch (error) {
      console.warn('Error requesting microphone permission:', error);
      return false;
    } finally {
      setIsRequesting(false);
    }
  }, [isRequesting]);

  // Check permission on mount
  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  return {
    hasPermission,
    isRequesting,
    requestPermission,
    checkPermission,
    openSettings: openAppSettings,
  };
};
