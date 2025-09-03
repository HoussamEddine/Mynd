import { Linking } from 'react-native';
import { supabase } from '../lib/supabase';

export class DeepLinkHandler {
  private static instance: DeepLinkHandler;
  private listeners: ((url: string) => void)[] = [];

  static getInstance(): DeepLinkHandler {
    if (!DeepLinkHandler.instance) {
      DeepLinkHandler.instance = new DeepLinkHandler();
    }
    return DeepLinkHandler.instance;
  }

  private constructor() {
    this.setupDeepLinkListener();
  }

  private setupDeepLinkListener() {
    // Handle app launch from deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('[DEEP_LINK] App launched with URL:', url);
        this.handleDeepLink(url);
      }
    });

    // Handle deep links while app is running
    const subscription = Linking.addEventListener('url', (event) => {
      console.log('[DEEP_LINK] Received deep link:', event.url);
      this.handleDeepLink(event.url);
    });

    return subscription;
  }

  private async handleDeepLink(url: string) {
    console.log('[DEEP_LINK] Processing URL:', url);

    try {
      const parsedUrl = new URL(url);
      
      // Handle OAuth callback
      if (parsedUrl.pathname === '/auth/callback') {
        console.log('[DEEP_LINK] OAuth callback detected');
        await this.handleOAuthCallback(url);
      }
      
      // Notify listeners
      this.listeners.forEach(listener => listener(url));
      
    } catch (error) {
      console.error('[DEEP_LINK] Error processing deep link:', error);
    }
  }

  private async handleOAuthCallback(url: string) {
    try {
      console.log('[DEEP_LINK] Processing OAuth callback:', url);
      
      const parsedUrl = new URL(url);
      
      // Extract tokens from URL parameters
      let accessToken = parsedUrl.searchParams.get('access_token');
      let refreshToken = parsedUrl.searchParams.get('refresh_token');
      
      // Check hash fragment if not in query params
      if (!accessToken && parsedUrl.hash) {
        const fragment = parsedUrl.hash.substring(1);
        const params = new URLSearchParams(fragment);
        accessToken = params.get('access_token');
        refreshToken = params.get('refresh_token');
      }
      
      if (accessToken) {
        console.log('[DEEP_LINK] Setting session with OAuth tokens');
        
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        });
        
        if (error) {
          console.error('[DEEP_LINK] Session error:', error);
        } else if (data.user) {
          console.log('[DEEP_LINK] OAuth session established:', data.user.email);
        }
      } else {
        console.warn('[DEEP_LINK] No access token found in OAuth callback');
      }
      
    } catch (error) {
      console.error('[DEEP_LINK] Error handling OAuth callback:', error);
    }
  }

  // Add listener for deep link events
  addListener(listener: (url: string) => void) {
    this.listeners.push(listener);
    
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Remove all listeners
  removeAllListeners() {
    this.listeners = [];
  }
}

export const deepLinkHandler = DeepLinkHandler.getInstance(); 