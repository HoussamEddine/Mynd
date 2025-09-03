import { Audio } from 'expo-av';
import { Alert, Linking, Platform } from 'react-native';

export const requestMicrophonePermission = async (): Promise<boolean> => {
  try {
    // Request permission first
    const { status: existingStatus } = await Audio.requestPermissionsAsync();
    
    if (existingStatus === 'granted') {
      return true;
    }
    
    // If permission was denied, show an explanation and ask again
    if (existingStatus === 'denied') {
      const { status } = await Audio.requestPermissionsAsync();
      return status === 'granted';
    }
    
    // If permission is undetermined, request it
    if (existingStatus === 'undetermined') {
      const { status } = await Audio.requestPermissionsAsync();
      return status === 'granted';
    }
    
    return false;
  } catch (err) {
    console.warn('Error requesting microphone permission:', err);
    return false;
  }
};

export const showPermissionDeniedAlert = (onOpenSettings: () => void) => {
  Alert.alert(
    'Microphone Permission Required',
    'Mynd needs access to your microphone to record audio. Please enable microphone access in your device settings.',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Open Settings',
        onPress: onOpenSettings,
      },
    ],
    { cancelable: false }
  );
};

export const openAppSettings = async () => {
  if (Platform.OS === 'ios') {
    await Linking.openURL('app-settings:');
  } else {
    await Linking.openSettings();
  }
};
