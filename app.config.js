const path = require('path');
require('dotenv').config();

module.exports = {
  name: 'Mynd',
  slug: 'mynd',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/logo.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/logo.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  plugins: [
    'expo-font',
    'expo-apple-authentication',
    [
      '@react-native-google-signin/google-signin',
      {
        iosUrlScheme: process.env.EXPO_PUBLIC_IOS_GOOGLE_URL_SCHEME
      }
    ],
    'expo-splash-screen',
    'expo-updates',
  ],
  updates: {
    url: 'https://u.expo.dev/YOUR-PROJECT-ID'
  },
  runtimeVersion: "1.0.0",
  assetBundlePatterns: [
    '**/*'
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.nextbit.mynd',
    googleServicesFile: './ios/Mynd/GoogleService-Info.plist',
    deploymentTarget: '14.0',
    config: {
      googleSignIn: {
        reservedClientId: process.env.EXPO_PUBLIC_IOS_GOOGLE_RESERVED_CLIENT_ID
      }
    },
    usesNonExemptEncryption: false,
    infoPlist: {
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: false,
        NSAllowsLocalNetworking: true,
        NSExceptionDomains: {
          'localhost': {
            NSExceptionAllowsInsecureHTTPLoads: true,
            NSExceptionMinimumTLSVersion: '1.0',
            NSIncludesSubdomains: true
          },
          '0.0.0.0': {
            NSExceptionAllowsInsecureHTTPLoads: true,
            NSExceptionMinimumTLSVersion: '1.0',
            NSIncludesSubdomains: true
          },
          '127.0.0.1': {
            NSExceptionAllowsInsecureHTTPLoads: true,
            NSExceptionMinimumTLSVersion: '1.0',
            NSIncludesSubdomains: true
          }
        }
      }
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/logo.png',
      backgroundColor: '#ffffff'
    },
    package: 'com.nextbit.mynd',
    googleServicesFile: './google-services.json'
  },
  web: {
    favicon: './assets/favicon.png'
  },
  extra: {
    eas: {
      projectId: '76805d07-0ae4-4626-a3b0-c1eca67b5d39'
    },
    IOS_GOOGLE_CLIENT_ID: process.env.EXPO_PUBLIC_IOS_GOOGLE_CLIENT_ID,
    ANDROID_GOOGLE_CLIENT_ID: process.env.EXPO_PUBLIC_ANDROID_GOOGLE_CLIENT_ID,
    WEB_CLIENT_ID: process.env.EXPO_PUBLIC_WEB_GOOGLE_CLIENT_ID,
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  }
}; 