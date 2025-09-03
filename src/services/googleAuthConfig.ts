import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Ensure environment variables are properly typed
interface GoogleAuthConfig {
  IOS_CLIENT_ID: string;
  WEB_CLIENT_ID: string;
}

// Get Google configuration from expo config
const GOOGLE_CONFIG: GoogleAuthConfig = {
  IOS_CLIENT_ID: Constants.expoConfig?.extra?.IOS_GOOGLE_CLIENT_ID || '',
  WEB_CLIENT_ID: Constants.expoConfig?.extra?.WEB_CLIENT_ID || '',
};

// Initialize Google Sign-In configuration based on platform
// Temporarily disabled for React Native 0.74 compatibility
export function initializeGoogleAuth(): void {
  // console.warn('[GOOGLE_AUTH] Google Sign-In temporarily disabled for React Native 0.74 compatibility');
  // TODO: Re-implement with expo-auth-session or compatible alternative
} 